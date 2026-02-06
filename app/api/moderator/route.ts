import { NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function POST(req: Request) {
  // ------------------------------------------------------------------
  // 🚨 ISOLATION TEST: Leave this line UNCOMMENTED to test if uploads work 
  // without the Google filter. (Delete this line when ready to enable filter).
  // return NextResponse.json({ safe: true });
  // ------------------------------------------------------------------

  console.log("🚀 STARTING MODERATION REQUEST");

  try {
    // FIX 1: Handle 'undefined' key safely
    // We default to an empty string '' if the key is missing, so .split() doesn't crash
    const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';
    const privateKey = rawKey.split(String.raw`\n`).join('\n');

    const client = new ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      projectId: process.env.GOOGLE_PROJECT_ID,
    });

    const { url, type } = await req.json();
    console.log("📸 Received URL:", url);

    if (type === 'image') {
      const [result] = await client.safeSearchDetection(url);
      const detections = result.safeSearchAnnotation;

      // FIX 2: Check if detections exists before accessing properties
      if (detections) {
        // We use optional chaining (?) just in case one property is missing
        const isUnsafe = 
          detections.adult === 'LIKELY' || detections.adult === 'VERY_LIKELY' ||
          detections.violence === 'LIKELY' || detections.violence === 'VERY_LIKELY' ||
          detections.racy === 'LIKELY' || detections.racy === 'VERY_LIKELY';

        if (isUnsafe) {
          return NextResponse.json({ safe: false, reason: "Explicit content detected." });
        }
      }
    }

    return NextResponse.json({ safe: true });

  } catch (error: any) {
    console.error("🔥 CRITICAL ERROR:", error);
    return NextResponse.json({ 
        safe: false, 
        reason: `DEBUG ERROR: ${error.message}` 
    }, { status: 200 });
  }
}