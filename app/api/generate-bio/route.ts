import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ text: "ERROR: Missing API Key in Vercel Settings!" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { type, prompt, tone = 'casual' } = await req.json();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let systemPrompt = '';
    if (type === 'post') {
      systemPrompt = `Write a short social media post about: "${prompt}". Tone: ${tone}.`;
    } else {
      systemPrompt = `Write a short 2-sentence bio about: "${prompt}".`;
    }

    // Attempt to talk to Google
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    return NextResponse.json({ text: text });

  } catch (error: any) {
    // 🔥 THE MAGIC TRICK: This stops the 500 error and sends Google's exact complaint straight to your frontend text box!
    return NextResponse.json({ 
      text: `GOOGLE API REJECTED THE REQUEST. Reason: ${error.message}` 
    });
  }
}