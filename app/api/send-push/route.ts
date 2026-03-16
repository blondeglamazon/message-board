import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Firebase Admin safely
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// 2. Initialize Supabase Admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { receiverId, title, body } = await req.json();

    // 3. Find ALL push tokens for this user (they might have an iPhone and an iPad)
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', receiverId);

    if (error || !tokens || tokens.length === 0) {
      return NextResponse.json({ error: 'No push tokens found for user' }, { status: 404 });
    }

    // Extract just the token strings into an array
    const tokenArray = tokens.map(t => t.token);

    // 4. Send the notification to ALL their devices via Firebase Multicast
    const message = {
      notification: { title, body },
      tokens: tokenArray, // Note: using 'tokens' (plural) here for multicast
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount 
    });
    
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}