import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // 1. This will print to your VS Code terminal the second you click the button
  console.log("🟢 [GEMINI] AI Request Received!");

  try {
    // 2. Explicitly check if the API key exists before trying to use it
    if (!process.env.GEMINI_API_KEY) {
      console.log("🔴 [GEMINI] ERROR: No API Key found in .env.local!");
      return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
    }

    // 3. Initialize inside the function
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const { type, prompt, tone = 'casual' } = await req.json();
    console.log(`🟡 [GEMINI] Task: ${type.toUpperCase()} | Prompt: "${prompt}"`);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let systemPrompt = '';
    if (type === 'post') {
      systemPrompt = `You are an expert social media creator for a platform called VIMciety. 
      Write a highly engaging, public story/post based on this topic: "${prompt}". 
      The tone of the post should be ${tone}. 
      Make it engaging, include a hook, use relevant emojis, and add 3-5 relevant hashtags at the end.`;
    } else {
      systemPrompt = `You are an expert profile bio writer for a social app called VIMciety. 
      Write a short, catchy, 2-sentence bio based on these keywords: "${prompt}". 
      Keep it fun and under 150 characters. Do not use hashtags.`;
    }

    console.log("🟡 [GEMINI] Sending to Google AI...");

    // 4. Generate the text
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    console.log("🟢 [GEMINI] Success! Generated Text:", text);

    return NextResponse.json({ text: text });

  } catch (error) {
    // If anything fails, it will loudly print here!
    console.error('🔴 [GEMINI] CRITICAL ERROR:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}