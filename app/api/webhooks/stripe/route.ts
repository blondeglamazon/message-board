import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

// Initialize Supabase with the SERVICE_ROLE key (Bypasses security rules to make Admin edits)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // 🛡️ Verify the webhook is authentically from Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // 💳 Listen for successful checkouts
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Grab the User ID and Tier Name we attached during Checkout
    const userId = session.metadata?.userId || session.client_reference_id;
    const tierName = session.metadata?.tierName;

    if (userId) {
      console.log(`🤑 Upgrading user ${userId} to ${tierName}`);

      // 💾 Update their row in Supabase!
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          is_premium: true, // Everyone who pays gets VIM+ status
          is_verified: tierName === 'Verified' // Only Verified tier gets the checkmark
        })
        .eq('id', userId);

      if (error) {
          console.error("Database update failed:", error);
      } else {
          console.log(`✅ Success! Badges awarded to user ${userId}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}