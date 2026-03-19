import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe securely
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover', // Use the standard API version
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId, userId, tierName } = body; 

    // Safety check: Make sure we know what they are buying and who they are!
    if (!priceId || !userId) {
      return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // 🛒 Create the secure Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // Because these are monthly recurring charges!
      
      // Where to send the user when they successfully pay
      success_url: `${baseUrl}/?upgrade=success`,
      
      // Where to send them if they back out
      cancel_url: `${baseUrl}/upgrade?canceled=true`,
      
      // 🔗 Attach the User ID so Stripe knows who is checking out
      client_reference_id: userId, 
      metadata: {
        userId: userId,
        tierName: tierName // Tells the webhook if they get the Verified badge or just VIM+
      }
    });

    // Send the secure checkout URL back to the frontend so it can open the window
    return NextResponse.json({ url: session.url });
    
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}