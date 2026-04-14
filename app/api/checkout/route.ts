import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[api/checkout] STRIPE_SECRET_KEY not set');
      return NextResponse.json({ error: 'Server misconfigured: missing Stripe key' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover' as any,
    });

    const body = await request.json();
    const { priceId, userId, tierName } = body;

    // Log what we received (visible in Vercel logs for debugging)
    console.log('[api/checkout] received:', { 
      priceId: priceId || '<EMPTY>', 
      userId, 
      tierName,
      keyMode: process.env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'live' : 'test',
    });

    if (!priceId || !userId) {
      console.error('[api/checkout] missing requirements:', { hasPriceId: !!priceId, hasUserId: !!userId });
      return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 });
    }

    if (!priceId.startsWith('price_')) {
      console.error('[api/checkout] invalid priceId format:', priceId);
      return NextResponse.json({ error: `Invalid price ID format: "${priceId}". Check NEXT_PUBLIC_STRIPE_PRICE_* env vars.` }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.vimciety.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${baseUrl}/?upgrade=success`,
      cancel_url: `${baseUrl}/upgrade?canceled=true`,
      client_reference_id: userId,
      metadata: { userId, tierName },
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    // Log the full error to Vercel with structured context
    console.error('[api/checkout] Stripe error:', {
      type: error?.type,
      code: error?.code,
      message: error?.message,
      statusCode: error?.statusCode,
      raw: error?.raw?.message,
    });
    // Return the Stripe error message to the client so it actually shows up in the toast
    return NextResponse.json({ 
      error: error?.raw?.message || error?.message || 'Checkout session creation failed' 
    }, { status: 500 });
  }
}