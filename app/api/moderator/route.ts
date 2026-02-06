import { NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function POST(req: Request) {
  // 1. Log that we actually started (Look for this in Vercel logs later)
  console.log("🚀 STARTING MODERATION REQUEST");

  try {
    // 2. Initialize the Google Client
    // We use a robust replace to handle different private key formats
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.split(String.raw`\n`).join('\n')
      : undefined;

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
      // 3. Scan the image
      const [result] = await client.safeSearchDetection(url);
      const detections = result.safeSearchAnnotation;

      if (detections) {
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
    
    // IMPORTANT: Return Status 200 so the browser can read the error message!
    // We send the technical error in the "reason" field so you see it in the popup.
    return NextResponse.json({ 
        safe: false, 
        reason: `DEBUG ERROR: ${error.message}` 
    }, { status: 200 });
  }
}