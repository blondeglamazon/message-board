import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

// 1. Safe Firebase Initialization
function initFirebase() {
  if (!admin.apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('⚠️ Firebase environment variables are missing. Skipping initialization.');
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
    // 🛡️ SECURITY CHECK: Ensure only you (the admin) can trigger this!
    const authHeader = req.headers.get('Authorization');
    const adminSecret = process.env.ADMIN_SECRET_KEY;

    // You will need to add ADMIN_SECRET_KEY to your Vercel/Appflow environment variables
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Unauthorized. Invalid admin secret.' }, { status: 401 });
    }

    const { title, body, data } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing required fields: title, body' }, { status: 400 });
    }

    const isFirebaseReady = initFirebase();
    if (!isFirebaseReady) {
      return NextResponse.json({ error: 'Firebase is not initialized.' }, { status: 500 });
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 📡 FETCH ALL TOKENS (Limiting to 10,000 for server safety, can be increased later)
    const { data: tokens, error } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .limit(10000);

    if (error || !tokens || tokens.length === 0) {
      return NextResponse.json({ error: 'No push tokens found in the database.' }, { status: 404 });
    }

    // Remove any duplicate tokens so devices don't get double-pinged
    const uniqueTokens = [...new Set(tokens.map(t => t.token))];

    let totalSuccessCount = 0;
    let totalFailureCount = 0;
    const tokensToDelete: string[] = [];

    // 📦 FIREBASE LIMIT: We MUST send in batches of 500 tokens maximum!
    const CHUNK_SIZE = 500;
    
    for (let i = 0; i < uniqueTokens.length; i += CHUNK_SIZE) {
      const tokenChunk = uniqueTokens.slice(i, i + CHUNK_SIZE);
      
      const message = {
        notification: { title, body },
        data: data || {}, // Optional deep-linking data
        tokens: tokenChunk, 
      };

      // Send this batch to Firebase
      const response = await admin.messaging().sendEachForMulticast(message);
      
      totalSuccessCount += response.successCount;
      totalFailureCount += response.failureCount;
      
      // Look for dead tokens in this specific batch
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
          tokensToDelete.push(tokenChunk[idx]);
        }
      });
    }

    // 🧹 CLEANUP: Delete all dead tokens across all batches
    if (tokensToDelete.length > 0) {
      // Supabase has URL length limits, so if we have hundreds of bad tokens, 
      // we should delete them in a quick loop rather than one massive array.
      for (let i = 0; i < tokensToDelete.length; i += 100) {
        const deleteChunk = tokensToDelete.slice(i, i + 100);
        await supabaseAdmin
          .from('push_tokens')
          .delete()
          .in('token', deleteChunk);
      }
      console.log(`Cleaned up ${tokensToDelete.length} stale tokens from the database.`);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Broadcast complete! Sent: ${totalSuccessCount}. Failed: ${totalFailureCount}.`,
      successCount: totalSuccessCount,
      failureCount: totalFailureCount,
      staleTokensRemoved: tokensToDelete.length
    });
    
  } catch (error: any) {
    console.error('Error sending broadcast push:', error);
    return NextResponse.json({ error: error?.message || 'Failed to send broadcast' }, { status: 500 });
  }
}