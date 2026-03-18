import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});

// 2. Initialize Master Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    // THE FIX IS HERE: Awaiting headers()
    const signature = (await headers()).get('stripe-signature') as string;
    
    // We will get this secret from the Stripe Dashboard in the next step!
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    // 3. Verify this request actually came from Stripe (Security!)
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 4. If the payment was successful, let's process it!
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Pull the hidden data we attached in Step 2
      const sellerId = session.metadata?.sellerId;
      const itemName = session.metadata?.itemName;
      const amountTotal = session.amount_total; // e.g., 500 cents

      if (sellerId && itemName && amountTotal) {
        // A. Save the sale to our new Supabase table
        await supabase.from('sales').insert({
          seller_id: sellerId,
          item_name: itemName,
          amount_in_cents: amountTotal,
        });

        // B. (Optional but awesome) Trigger your existing push notification system!
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vimciety.com';
        await fetch(`${baseUrl}/api/send-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: sellerId,
            title: "Cha-ching! 💸",
            body: `Someone just bought your ${itemName}!`
          })
        }).catch(err => console.error("Failed to send push:", err));
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}