import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Secure your webhook so hackers can't fake purchases
    // You will set this secret password in your RevenueCat dashboard later
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Read the message from RevenueCat
    const body = await request.json();
    const event = body.event;

    // This is the database ID you passed in during Step 1!
    const userId = event.app_user_id; 
    const productId = event.product_id;

    // 3. Update your database based on what happened
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        console.log(`✅ SUCCESS: User ${userId} bought ${productId}`);
        // TODO: Write code here to update your database 
        // e.g., db.users.update({ id: userId, isPremium: true })
        break;

      case 'CANCELLATION':
      case 'EXPIRATION':
        console.log(`❌ EXPIRED: User ${userId} lost access to ${productId}`);
        // TODO: Write code here to remove premium status in your database
        // e.g., db.users.update({ id: userId, isPremium: false })
        break;

      default:
        console.log(`Ignoring event type: ${event.type}`);
    }

    // 4. Always tell RevenueCat "Message Received" so they stop sending it
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}