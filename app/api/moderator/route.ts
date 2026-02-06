import { NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function POST(req: Request) {
  console.log("🚀 STARTING MODERATION REQUEST");

  try {
    // 1. FIX: Handle the Key safely so it doesn't crash
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
      // 2. Scan the image
      const [result] = await client.safeSearchDetection(url);
      const detections = result.safeSearchAnnotation;

      // 3. FIX: Check if detections exist before reading them
      if (detections) {
        const isUnsafe = 
          detections.adult === 'LIKELY' || detections.adult === 'VERY_LIKELY' ||
          detections.violence === 'LIKELY' || detections.violence === 'VERY_LIKELY' ||
          detections.racy === 'LIKELY' || detections.racy === 'VERY_LIKELY';

        if (isUnsafe) {
          console.log("🚨 BLOCKING unsafe content!");
          return NextResponse.json({ safe: false, reason: "Explicit content detected." });
        }
      }
    }

    // If we get here, it's safe!
    return NextResponse.json({ safe: true });

  } catch (error: any) {
    console.error("🔥 CRITICAL ERROR:", error);
    // Return error in a way the browser can read it
    return NextResponse.json({ 
        safe: false, 
        reason: `DEBUG ERROR: ${error.message}` 
    }, { status: 200 });
  }
}