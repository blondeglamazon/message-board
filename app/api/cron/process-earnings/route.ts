import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 💰 MONETIZATION CONSTANTS
const RATE_PER_VIEW = 0.001;        // $0.003/view = $3 RPM (industry standard)
const MIN_FOLLOWERS_TO_EARN = 1000;  // Must have 1000+ followers to earn from views

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = {
    videoPayouts: { success: false, paidOutCreators: 0, viewsProcessed: 0, skippedCreators: 0, error: null as string | null },
    referralPayouts: { success: false, paid: 0, rejected: 0, error: null as string | null },
  };

  // =============================================
  // PART 1: VIDEO VIEW PAYOUTS
  // =============================================
  try {
    // Fetch unprocessed views
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
      if (!posts) throw new Error("Failed to fetch posts");
      const postToCreator = Object.fromEntries(posts.map(p => [p.id, p.user_id]));

      // Aggregate view counts per creator (NOT watch time — now paying per view)
      const creatorViewCounts: Record<string, number> = {};
      const viewIdsToMark: string[] = [];

      views.forEach(view => {
        const creatorId = postToCreator[view.post_id];
        if (creatorId) {
          creatorViewCounts[creatorId] = (creatorViewCounts[creatorId] || 0) + 1;
          viewIdsToMark.push(view.id);
        }
      });

      let paidOutCreators = 0;
      let skippedCreators = 0;

      // Process each creator
      for (const [creatorId, viewCount] of Object.entries(creatorViewCounts)) {
        // 🚫 GATE: Must have 1000+ followers
        const { count: followerCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', creatorId);

        const followers = followerCount || 0;

        if (followers < MIN_FOLLOWERS_TO_EARN) {
          console.log(`⏭️ Skipping creator ${creatorId}: ${followers} followers (need ${MIN_FOLLOWERS_TO_EARN})`);
          skippedCreators++;
          continue;
        }

        // 💰 Calculate earnings at flat industry-standard rate
        const earnedAmount = viewCount * RATE_PER_VIEW;

        const { data: currentRecord } = await supabase
          .from('creator_earnings')
          .select('*')
          .eq('user_id', creatorId)
          .single();

        if (currentRecord) {
          await supabase.from('creator_earnings').update({
            unpaid_balance: Number(currentRecord.unpaid_balance) + earnedAmount,
            total_earned_lifetime: Number(currentRecord.total_earned_lifetime) + earnedAmount
          }).eq('user_id', creatorId);
        } else {
          await supabase.from('creator_earnings').insert({
            user_id: creatorId,
            unpaid_balance: earnedAmount,
            total_earned_lifetime: earnedAmount
          });
        }

        paidOutCreators++;
      }

      // Mark all views as processed (even skipped ones — they don't get re-processed later)
      if (viewIdsToMark.length > 0) {
        await supabase.from('video_views').update({ is_processed: true }).in('id', viewIdsToMark);
      }

      results.videoPayouts = {
        success: true,
        paidOutCreators,
        viewsProcessed: viewIdsToMark.length,
        skippedCreators,
        error: null,
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

  const hasErrors = results.videoPayouts.error || results.referralPayouts.error;

  return NextResponse.json(
    {
      success: !hasErrors,
      videoPayouts: results.videoPayouts,
      referralPayouts: results.referralPayouts,
    },
    { status: hasErrors ? 207 : 200 }
  );
}