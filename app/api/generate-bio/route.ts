import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Initialize the Gemini API with your secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // 1. We now accept 'type', 'prompt' (keywords/topic), and an optional 'tone'
    const { type, prompt, tone = 'casual' } = await req.json();

    // 2. Select the Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let systemPrompt = '';

    // 3. Switch the instructions based on what the user requested
    if (type === 'post') {
      systemPrompt = `You are an expert social media creator for a platform called VIMciety. 
      Write a highly engaging, public story/post based on this topic: "${prompt}". 
      The tone of the post should be ${tone}. 
      Make it engaging, include a hook, use relevant emojis, and add 3-5 relevant hashtags at the end.`;
    } else {
      // Default to the Bio writer
      systemPrompt = `You are an expert profile bio writer for a social app called VIMciety. 
      Write a short, catchy, 2-sentence bio based on these keywords: "${prompt}". 
      Keep it fun and under 150 characters. Do not use hashtags.`;
    }

    // 4. Generate the text
    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    // 5. Send the generated text back to the phone
    // (We changed this from { bio: text } to { text: text } so it works for both features!)
    return NextResponse.json({ text: text });

  } catch (error) {
    console.error('Gemini Error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}