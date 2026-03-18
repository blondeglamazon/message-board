import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Initialize Stripe INSIDE the POST function
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover',
    });

    // 2. Initialize Master Supabase Client INSIDE the POST function
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.text();
    const signature = (await headers()).get('stripe-signature') as string;
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    // 3. Verify this request actually came from Stripe
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 4. Process the successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const sellerId = session.metadata?.sellerId;
      const itemName = session.metadata?.itemName;
      const amountTotal = session.amount_total; 

      if (sellerId && itemName && amountTotal) {
        // Save the sale to Supabase
        await supabase.from('sales').insert({
          seller_id: sellerId,
          item_name: itemName,
          amount_in_cents: amountTotal,
        });

        // Trigger Push Notification
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