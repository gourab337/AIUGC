import OpenAI from 'openai';

// xAI / Grok — OpenAI-compatible API
function getXAIClient(): OpenAI | null {
  if (!process.env.XAI_API_KEY) return null;
  return new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
  });
}

export async function generateScriptWithXAI(input: {
  prompt: string;
  tone: string;
  platform: string;
  duration: number;
  hookStyle?: string;
  ctaStyle?: string;
  audience?: string;
}): Promise<string | null> {
  const client = getXAIClient();
  if (!client) return null;

  const systemPrompt = `You are an expert UGC (user-generated content) scriptwriter for social media.
Generate concise, high-converting video scripts optimized for ${input.platform}.
Tone: ${input.tone}. Target duration: ${input.duration} seconds.
Format the output as:
HOOK: [opening line - first 3 seconds]
BODY: [main content]
CTA: [call to action]`;

  const userPrompt = `Write a ${input.tone} ${input.platform} video script about: ${input.prompt}
${input.hookStyle ? `Hook style: ${input.hookStyle}` : ''}
${input.ctaStyle ? `CTA style: ${input.ctaStyle}` : ''}
${input.audience ? `Target audience: ${input.audience}` : ''}
Duration: approximately ${input.duration} seconds.`;

  const response = await client.chat.completions.create({
    model: 'grok-3',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content ?? null;
}
