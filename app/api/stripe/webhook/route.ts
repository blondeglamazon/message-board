import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    // 1. Initialize Stripe with a safe, standard API version
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-02-25.clover', 
    });

    // 2. Check for missing Supabase variables before continuing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(`Missing Supabase Keys! URL exists: ${!!supabaseUrl}, Key exists: ${!!supabaseKey}`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      throw new Error('Missing stripe-signature header');
    }

    // 3. Check for the Webhook Secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET in Vercel');
    }

    let event: Stripe.Event;

    // 4. Verify the connection
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Signature verification failed: ${err.message}`);
    }

    // 5. Process Payment & Save to Database
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const sellerId = session.metadata?.sellerId;
      const itemName = session.metadata?.itemName;
      const amountTotal = session.amount_total; 

      if (sellerId && itemName && amountTotal) {
        const { error: dbError } = await supabase.from('sales').insert({
          seller_id: sellerId,
          item_name: itemName,
          amount_in_cents: amountTotal,
        });

        if (dbError) {
          throw new Error(`Supabase Database Error: ${dbError.message}`);
        }
      } else {
        throw new Error(`Missing Metadata! Seller: ${sellerId}, Item: ${itemName}`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('WEBHOOK CRASH:', error.message);
    // This sends the EXACT error string back to Stripe so we can read it!
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}