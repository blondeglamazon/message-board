import { NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

export async function POST(req: Request) {
  try {
    // --- MOVED INSIDE: Initialize here to catch any key errors ---
    // We also use a more robust replacement for the newlines
    const client = new ImageAnnotatorClient({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.split(String.raw`\n`).join('\n'),
      },
      projectId: process.env.GOOGLE_PROJECT_ID,
    });
    // -------------------------------------------------------------

    const { url, type } = await req.json();

    // We only scan images for now
    if (type === 'image') {
      console.log("🔍 Scanning image:", url);

      const [result] = await client.safeSearchDetection(url);
      const detections = result.safeSearchAnnotation;

      if (!detections) return NextResponse.json({ safe: true });

      // Check for "LIKELY" or "VERY_LIKELY" in adult/violent categories
      const isUnsafe = 
        detections.adult === 'LIKELY' || detections.adult === 'VERY_LIKELY' ||
        detections.violence === 'LIKELY' || detections.violence === 'VERY_LIKELY' ||
        detections.racy === 'LIKELY' || detections.racy === 'VERY_LIKELY';

      if (isUnsafe) {
        console.log("🚨 BLOCKING unsafe content!");
        return NextResponse.json({ 
            safe: false, 
            reason: "Explicit or inappropriate content detected." 
        }, { status: 400 });
      }
    }

    // If we get here, the content is safe!
    return NextResponse.json({ safe: true });

  } catch (error: any) {
    console.error("Moderation Error:", error);
    // This will now print the REAL error message to your terminal/logs
    return NextResponse.json({ 
        safe: false, 
        reason: "Could not verify content safety.",
        details: error.message 
    }, { status: 500 });
  }
}