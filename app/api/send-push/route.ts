import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// 1. Helper function to initialize Firebase Admin securely.
// By keeping this inside a function, we prevent Next.js from executing it 
// globally during the 'next build' step, which stops the Appflow crash!
function initFirebase() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('⚠️ Firebase environment variables are missing. Skipping initialization. (Normal during build phase)');
      return false;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
  return true;
}

export async function POST(req: Request) {
  try {
    // Run the initialization check right when the API is actually called at runtime
    const isFirebaseReady = initFirebase();
    if (!isFirebaseReady) {
      return NextResponse.json({ error: 'Server misconfiguration: Firebase is not initialized.' }, { status: 500 });
    }

    // 2. Initialize Supabase Admin client
    // ⚠️ CRITICAL: Must use the SERVICE_ROLE_KEY to bypass RLS and read all push tokens!
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Added optional `data` payload so your frontend can do deep-linking (like opening a post)
    const { receiverId, title, body, data } = await req.json();

    if (!receiverId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields: receiverId, title, body' }, { status: 400 });
    }

    // 3. Find ALL push tokens for this user
    const { data: tokens, error } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .eq('user_id', receiverId);

    if (error || !tokens || tokens.length === 0) {
      return NextResponse.json({ error: 'No push tokens found for user' }, { status: 404 });
    }

    const tokenArray = tokens.map(t => t.token);

    // 4. Send the notification to ALL their devices
    const message = {
      notification: { title, body },
      data: data || {}, // Add the data payload here!
      tokens: tokenArray, 
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // 🧹 5. STALE TOKEN CLEANUP
    const tokensToDelete: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
        tokensToDelete.push(tokenArray[idx]);
      }
    });

    // Delete all dead tokens from Supabase in one batch query
    if (tokensToDelete.length > 0) {
      await supabaseAdmin
        .from('push_tokens')
        .delete()
        .in('token', tokensToDelete);
      console.log(`Cleaned up ${tokensToDelete.length} stale tokens.`);
    }

    return NextResponse.json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount 
    });
    
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ error: error?.message || 'Failed to send notification' }, { status: 500 });
  }
}