import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 💰 MONETIZATION CONSTANTS
const RATE_PER_VIEW = 0.001;         // $0.001/view = $1 RPM
const MIN_FOLLOWERS_TO_EARN = 1000;  // Must have 1000+ followers to earn from views

export async function GET(request: Request) {
  // Fix #8: protect the cron endpoint with a shared secret (Vercel cron pattern)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = {
    videoPayouts: { success: false, paidOutCreators: 0, viewsProcessed: 0, skippedCreators: 0, failedCreators: 0, error: null as string | null },
    referralPayouts: { success: false, paid: 0, rejected: 0, error: null as string | null },
    storefrontCommissions: { success: false, processed: 0, error: null as string | null },
  };

  // =============================================
  // PART 1: VIDEO VIEW PAYOUTS
  // =============================================
  try {
    const { data: views, error: viewsError } = await supabase
      .from('video_views')
      .select('id, post_id, watch_time_seconds')
      .eq('is_processed', false);

    if (viewsError) throw viewsError;

    if (!views || views.length === 0) {
      results.videoPayouts.success = true;
    } else {
      // Map posts to creators
      const postIds = [...new Set(views.map(v => v.post_id))];
      const { data: posts } = await supabase.from('posts').select('id, user_id').in('id', postIds);
      if (!posts) throw new Error('Failed to fetch posts');
      const postToCreator = Object.fromEntries(posts.map(p => [p.id, p.user_id]));

      // Group view IDs by creator so we can mark only successfully-paid views as processed
      const creatorViews: Record<string, string[]> = {};
      views.forEach(view => {
        const creatorId = postToCreator[view.post_id];
        if (creatorId) {
          if (!creatorViews[creatorId]) creatorViews[creatorId] = [];
          creatorViews[creatorId].push(view.id);
        }
      });

      let paidOutCreators = 0;
      let skippedCreators = 0;
      let failedCreators = 0;
      const successfullyProcessedViewIds: string[] = [];
      const skippedViewIds: string[] = [];

      // Process each creator
      for (const [creatorId, viewIds] of Object.entries(creatorViews)) {
        const viewCount = viewIds.length;

        // 🚫 GATE: Must have 1000+ followers
        const { count: followerCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', creatorId);

        const followers = followerCount || 0;

        if (followers < MIN_FOLLOWERS_TO_EARN) {
          console.log(`⏭️ Skipping creator ${creatorId}: ${followers} followers (need ${MIN_FOLLOWERS_TO_EARN})`);
          skippedCreators++;
          // Skipped views still get marked processed — they're not eligible and shouldn't be retried
          skippedViewIds.push(...viewIds);
          continue;
        }

        const earnedAmount = viewCount * RATE_PER_VIEW;

        // Fix #2: read existing balance with .maybeSingle() so missing row doesn't throw
        const { data: currentRecord, error: readError } = await supabase
          .from('creator_earnings')
          .select('unpaid_balance, total_earned_lifetime')
          .eq('user_id', creatorId)
          .maybeSingle();

        if (readError) {
          // Fix #4: don't swallow per-creator errors silently
          console.error(`❌ Failed to read earnings for creator ${creatorId}:`, readError);
          failedCreators++;
          continue;
        }

        // Fix #2 + #4: single upsert instead of select-then-update/insert,
        // and check the error so we don't claim success on a failed write
        const newUnpaid = Number(currentRecord?.unpaid_balance ?? 0) + earnedAmount;
        const newLifetime = Number(currentRecord?.total_earned_lifetime ?? 0) + earnedAmount;

        const { error: writeError } = await supabase
          .from('creator_earnings')
          .upsert({
            user_id: creatorId,
            unpaid_balance: newUnpaid,
            total_earned_lifetime: newLifetime,
          }, { onConflict: 'user_id' });

        if (writeError) {
          console.error(`❌ Failed to credit creator ${creatorId}:`, writeError);
          failedCreators++;
          // Fix #3: don't mark these views processed — they'll be retried next run
          continue;
        }

        paidOutCreators++;
        successfullyProcessedViewIds.push(...viewIds);
      }

      // Fix #3: mark only views that were either successfully paid OR intentionally skipped (sub-threshold)
      const viewIdsToMark = [...successfullyProcessedViewIds, ...skippedViewIds];
      if (viewIdsToMark.length > 0) {
        const { error: markError } = await supabase
          .from('video_views')
          .update({ is_processed: true })
          .in('id', viewIdsToMark);

        if (markError) {
          console.error('❌ Failed to mark views processed:', markError);
          // Earnings were already credited; flag this loudly so it can be reconciled
          throw new Error(`Earnings credited but views not marked: ${markError.message}`);
        }
      }

      results.videoPayouts = {
        success: failedCreators === 0,
        paidOutCreators,
        viewsProcessed: viewIdsToMark.length,
        skippedCreators,
        failedCreators,
        error: failedCreators > 0 ? `${failedCreators} creator(s) failed to process` : null,
      };
    }
  } catch (error: any) {
    console.error('Video payout error:', error);
    results.videoPayouts.error = error.message;
  }

  // =============================================
  // PART 2: REFERRAL PAYOUTS (90-day check)
  // =============================================
  try {
    const { data, error } = await supabase.rpc('process_referral_payouts');
    if (error) throw error;
    const payoutResults = data || [];
    results.referralPayouts = {
      success: true,
      paid: payoutResults.filter((r: any) => r.status === 'paid').length,
      rejected: payoutResults.filter((r: any) => r.status === 'rejected').length,
      error: null,
    };
  } catch (error: any) {
    console.error('Referral payout error:', error);
    results.referralPayouts.error = error.message;
  }

  // =============================================
  // PART 3: STOREFRONT AFFILIATE COMMISSIONS (60-day holding period)
  // =============================================
  try {
    const { data: processed, error } = await supabase.rpc('finalize_storefront_commissions');
    if (error) throw error;

    results.storefrontCommissions = {
      success: true,
      processed: processed ?? 0,
      error: null,
    };
    console.log(`💼 Storefront commissions: ${processed ?? 0} processed past 60-day hold`);
  } catch (error: any) {
    console.error('Storefront commission error:', error);
    results.storefrontCommissions.error = error.message;
  }

  const hasErrors =
    results.videoPayouts.error ||
    results.referralPayouts.error ||
    results.storefrontCommissions.error;

  // Fix #5: use 200 with success:false in body instead of nonstandard 207
  return NextResponse.json(
    {
      success: !hasErrors,
      videoPayouts: results.videoPayouts,
      referralPayouts: results.referralPayouts,
      storefrontCommissions: results.storefrontCommissions,
    },
    { status: 200 }
  );
}