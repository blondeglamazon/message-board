import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/app/lib/supabase/server'; 

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY in Environment Variables!");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
    });

    // 1. Get the seller's ID and the item details from the frontend
    const { sellerId, priceInCents, title } = await req.json();

    // 2. Look up the creator's connected Stripe account in your database
    const supabase = await createClient();
    const { data: seller } = await supabase
      .from('profiles')
      .select('stripe_account_id')
      .eq('id', sellerId)
      .single();

    if (!seller?.stripe_account_id) {
      return NextResponse.json({ error: 'This creator has not set up payouts yet.' }, { status: 400 });
    }

    // 3. VIMciety takes a 10% cut! (Math.round ensures we don't send fraction of cents)
    const platformFee = Math.round(priceInCents * 0.10);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vimciety.com';

    // 4. Generate the Stripe Checkout Page
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: title },
            unit_amount: priceInCents, // e.g. 500 = $5.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        sellerId: sellerId,
        itemName: title,
      },
      // THIS IS THE MAGIC PART: Routing the money!
      payment_intent_data: {
        application_fee_amount: platformFee, // 10% goes to VIMciety
        transfer_data: {
          destination: seller.stripe_account_id, // 90% goes to the creator
        },
      },
      success_url: `${baseUrl}/referral?checkout=success`,
      cancel_url: `${baseUrl}/referral?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}