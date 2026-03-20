import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // 1. Initialize Admin Client to bypass row-level security
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  );

  const results = {
    videoPayouts: { success: false, paidOutCreators: 0, viewsProcessed: 0, error: null as string | null },
    referralPayouts: { success: false, paid: 0, rejected: 0, error: null as string | null },
  };

  // =============================================
  // PART 1: VIDEO VIEW PAYOUTS (existing logic)
  // =============================================
  try {
    // 2. Fetch all UNPROCESSED video views
    const { data: views, error: viewsError } = await supabase
      .from('video_views')
      .select('id, post_id, watch_time_seconds')
      .eq('is_processed', false);

    if (viewsError) throw viewsError;

    if (!views || views.length === 0) {
      results.videoPayouts.success = true;
    } else {
      // 3. Find out which creator owns which video
      const postIds = [...new Set(views.map(v => v.post_id))];
      const { data: posts } = await supabase.from('posts').select('id, user_id').in('id', postIds);
      if (!posts) throw new Error("Failed to fetch posts");
      const postToCreator = Object.fromEntries(posts.map(p => [p.id, p.user_id]));

      // 4. Aggregate total watch time per creator
      const creatorWatchTime: Record<string, number> = {};
      const viewIdsToMark: string[] = [];

      views.forEach(view => {
        const creatorId = postToCreator[view.post_id];
        if (creatorId) {
          creatorWatchTime[creatorId] = (creatorWatchTime[creatorId] || 0) + view.watch_time_seconds;
          viewIdsToMark.push(view.id);
        }
      });

      // 5. Calculate earnings based on Tiers
      for (const [creatorId, totalSeconds] of Object.entries(creatorWatchTime)) {
        const { count: followerCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', creatorId);

        const followers = followerCount || 0;

        let ratePerMinute = 0;
        let tier = 0;

        if (followers >= 100000) { ratePerMinute = 0.035; tier = 5; }
        else if (followers >= 50000) { ratePerMinute = 0.025; tier = 4; }
        else if (followers >= 20000) { ratePerMinute = 0.02; tier = 3; }
        else if (followers >= 10000) { ratePerMinute = 0.015; tier = 2; }
        else if (followers >= 5000) { ratePerMinute = 0.01; tier = 1; }

        if (tier > 0) {
          const totalMinutes = totalSeconds / 60;
          const earnedAmount = totalMinutes * ratePerMinute;

          const { data: currentRecord } = await supabase
            .from('creator_earnings')
            .select('*')
            .eq('user_id', creatorId)
            .single();

          if (currentRecord) {
            await supabase.from('creator_earnings').update({
              current_tier: tier,
              total_minutes_watched: currentRecord.total_minutes_watched + Math.floor(totalMinutes),
              unpaid_balance: Number(currentRecord.unpaid_balance) + earnedAmount,
              total_earned_lifetime: Number(currentRecord.total_earned_lifetime) + earnedAmount
            }).eq('user_id', creatorId);
          } else {
            await supabase.from('creator_earnings').insert({
              user_id: creatorId,
              current_tier: tier,
              total_minutes_watched: Math.floor(totalMinutes),
              unpaid_balance: earnedAmount,
              total_earned_lifetime: earnedAmount
            });
          }
        }
      }

      // 6. Mark all views as processed
      if (viewIdsToMark.length > 0) {
        await supabase.from('video_views').update({ is_processed: true }).in('id', viewIdsToMark);
      }

      results.videoPayouts = {
        success: true,
        paidOutCreators: Object.keys(creatorWatchTime).length,
        viewsProcessed: viewIdsToMark.length,
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

  // =============================================
  // COMBINED RESPONSE
  // =============================================
  const hasErrors = results.videoPayouts.error || results.referralPayouts.error;

  return NextResponse.json(
    {
      success: !hasErrors,
      videoPayouts: results.videoPayouts,
      referralPayouts: results.referralPayouts,
    },
    { status: hasErrors ? 207 : 200 }  // 207 Multi-Status if partial failure
  );
}