import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 🛑 STOP NEXT.JS FROM CACHING THIS ROUTE
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key_for_build', {
    apiVersion: '2026-02-25.clover' as any,
  });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-for-build.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_build'
  );

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'dummy_webhook_secret'
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // 🔀 Route the event based on what happened in Stripe
  switch (event.type) {
    
    // 💳 1. A user bought a VIM+ or Verified subscription
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId || session.client_reference_id;
      const tierName = session.metadata?.tierName;

      if (userId) {
        console.log(`🤑 Upgrading user ${userId} to ${tierName}`);
        
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_premium: true, 
            is_verified: tierName === 'Verified' 
          })
          .eq('id', userId);

        if (error) console.error("Database update failed:", error);
      }
      break;
    }

    // 🏪 2. A user finished setting up their Stripe Connect storefront
    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      
      // Check if they are officially allowed to accept payments
      if (account.charges_enabled) {
        console.log(`🎉 Seller account ${account.id} is ready to receive payments!`);
        
        // Find the user by their Stripe Account ID and mark their shop as active
        const { error } = await supabaseAdmin
          .from('profiles')
          // You might want to add an 'is_seller_active' boolean to your database
          .update({ is_seller_active: true }) 
          .eq('stripe_account_id', account.id);

        if (error) console.error("Seller activation failed:", error);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}