import { NextResponse } from 'next/server';

// ------------------------------------------------------------------
// 🚨 ISOLATION TEST: ACTIVE
// We return "Safe" immediately.
// The Google Code is commented out below so it cannot cause errors.
// ------------------------------------------------------------------

export async function POST(req: Request) {
  return NextResponse.json({ safe: true });
}

/* // --- IGNORE EVERYTHING BELOW FOR NOW ---
// This keeps the code safe for later, but hides it from TypeScript errors.

import { ImageAnnotatorClient } from '@google-cloud/vision';

async function ORIGINAL_CODE(req: Request) {
  try {
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

    if (type === 'image') {
      const [result] = await client.safeSearchDetection(url);
      const detections = result.safeSearchAnnotation;

      if (detections) {
        const isUnsafe = 
          detections.adult === 'LIKELY' || detections.adult === 'VERY_LIKELY' ||
          detections.violence === 'LIKELY' || detections.violence === 'VERY_LIKELY' ||
          detections.racy === 'LIKELY' || detections.racy === 'VERY_LIKELY';

        if (isUnsafe) {
          return NextResponse.json({ safe: false });
        }
      }
    }
    return NextResponse.json({ safe: true });
  } catch (error) {
    return NextResponse.json({ safe: false });
  }
}
*/