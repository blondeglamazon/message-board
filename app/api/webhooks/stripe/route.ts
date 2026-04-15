import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build', {
      apiVersion: '2026-02-25.clover' as any,
    });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-for-build.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_build'
    );

    const body = await req.text();
    const signature = req.headers.get('stripe-signature') as string;

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || 'dummy_webhook_secret'
      );
    } catch (err: any) {
      console.error('[webhook] signature verification failed:', err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        // 1. Subscription upgrade path (from /upgrade page)
        if (metadata.userId && metadata.tierName) {
          console.log(`[webhook] Upgrading user ${metadata.userId} to ${metadata.tierName}`);

          const { error: upgradeError } = await supabaseAdmin
            .from('profiles')
            .update({
              is_premium: true,
              is_verified: metadata.tierName === 'Verified',
            })
            .eq('id', metadata.userId);

          if (upgradeError) {
            console.error('[webhook] profile upgrade failed:', upgradeError);
          }

          // STOREFRONT AFFILIATE COMMISSION: 25% of first-month subscription.
          // The RPC enforces all rules (referrer exists + premium, 90-day window,
          // one-shot per referred user) and credits creator_earnings if eligible.
          if (session.amount_total && session.amount_total > 0) {
            const { data: commissionId, error: commissionError } = await supabaseAdmin
              .rpc('record_storefront_commission', {
                p_referred_user_id: metadata.userId,
                p_subscription_cents: session.amount_total,
              });

            if (commissionError) {
              console.error('[webhook] record_storefront_commission failed:', commissionError);
              // Don't fail the webhook — the upgrade itself succeeded.
            } else if (commissionId) {
              console.log(`[webhook] 🎉 25% commission recorded (id: ${commissionId})`);
            } else {
              console.log(`[webhook] no commission awarded (no eligible referrer / outside 90d / not premium / duplicate)`);
            }
          }
        }
        // 2. Product sale path (from BuyButton)
        else if (metadata.sellerId && metadata.itemName && session.amount_total) {
          console.log(`[webhook] Recording sale for seller ${metadata.sellerId}`);
          const { error } = await supabaseAdmin.from('sales').insert({
            seller_id: metadata.sellerId,
            item_name: metadata.itemName,
            amount_in_cents: session.amount_total,
          });

          if (error) console.error('[webhook] sale insert failed:', error);
        } else {
          console.warn('[webhook] checkout.session.completed with unrecognized metadata:', metadata);
        }
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled) {
          console.log(`[webhook] Seller account ${account.id} is ready`);
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_merchant: true })
            .eq('stripe_account_id', account.id);

          if (error) console.error('[webhook] seller activation failed:', error);
        }
        break;
      }

      default:
        console.log(`[webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[webhook] crash:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}