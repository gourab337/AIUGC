import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { updateJob } from './jobStore';
import { wsClients } from '../wsClients';

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const INFERENCE_URL = process.env.INFERENCE_URL ?? 'http://localhost:8000';
const BASE_URL = `http://localhost:${process.env.PORT ?? 3001}`;

export const GENERATED_DIR = process.env.GENERATED_DIR
  ?? path.join(process.cwd(), 'public', 'generated');

export const LOCAL_SCRIPT_MODELS = new Set([
  'qwen2.5-7b-local',
  'qwen2.5-3b-local',
  'llama-4-scout',
  'mistral-small-4',
]);

export const LOCAL_IMAGE_MODELS = new Set([
  'flux-schnell-local',
  'flux-dev-local',
]);

export const LOCAL_VOICE_MODELS = new Set([
  'kokoro-82m-local',
  'cosyvoice-2-local',
]);

export const LOCAL_VIDEO_MODELS = new Set([
  'ltx-2-3-local',
  'ffmpeg-kenburns-local',
]);

// Map registry IDs → Ollama model tags
const OLLAMA_MODEL_MAP: Record<string, string> = {
  'qwen2.5-7b-local': 'qwen2.5:7b',
  'qwen2.5-3b-local': 'qwen2.5:3b',
  'llama-4-scout': 'qwen2.5:7b',
  'mistral-small-4': 'qwen2.5:7b',
};

interface OllamaChatResponse {
  message?: { role: string; content: string };
  done: boolean;
  error?: string;
}

// ─── Script via Ollama ──────────────────────────────────────────────────────

export async function generateScriptLocal(input: {
  prompt: string;
  tone: string;
  platform: string;
  duration: number;
  modelId: string;
  hookStyle?: string;
  ctaStyle?: string;
  audience?: string;
}): Promise<string | null> {
  const ollamaModel = OLLAMA_MODEL_MAP[input.modelId] ?? 'qwen2.5:7b';

  const systemPrompt = `You are an expert UGC (user-generated content) scriptwriter for social media.
Generate concise, high-converting video scripts optimized for ${input.platform}.
Tone: ${input.tone}. Target duration: ${input.duration} seconds.
Format the output as:
HOOK: [opening line - first 3 seconds]
BODY: [main content]
CTA: [call to action]`;

  const userPrompt = `Write a ${input.tone} ${input.platform} video script about: ${input.prompt}${input.hookStyle ? `\nHook style: ${input.hookStyle}` : ''}${input.ctaStyle ? `\nCTA style: ${input.ctaStyle}` : ''}${input.audience ? `\nTarget audience: ${input.audience}` : ''}\nDuration: approximately ${input.duration} seconds.`;

  const r = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      keep_alive: '2m',
      options: { num_predict: 500 },
    }),
  });

  if (!r.ok) {
    throw new Error(`Ollama error: ${r.status} ${await r.text()}`);
  }

  const data = await r.json() as OllamaChatResponse;
  if (data.error) throw new Error(`Ollama: ${data.error}`);
  return data.message?.content ?? null;
}

// ─── Image via Python inference server (mflux / FLUX.1-Schnell) ─────────────

export async function generateImageLocal(input: {
  prompt: string;
  style?: string;
  width: number;
  height: number;
  steps: number;
  modelId?: string;
}): Promise<string[] | null> {
  const alias = input.modelId === 'flux-dev-local' ? 'dev' : 'schnell';
  const result = await callInference('/image/generate', {
    prompt: input.prompt,
    style: input.style ?? 'cinematic',
    width: input.width,
    height: input.height,
    steps: Math.min(input.steps, 30),
    num_images: 3,
    model_alias: alias,
  }, 300_000);
  if (result.urls && Array.isArray(result.urls)) return result.urls as string[];
  if (result.url) return [result.url as string];
  return null;
}

// ─── Voice via Python inference server (Kokoro 82M) ─────────────────────────

export async function generateVoiceLocal(input: {
  text: string;
  voiceId?: string;
  speed?: number;
  emotion?: string;
}): Promise<string | null> {
  const result = await callInference('/voice/generate', {
    text: input.text,
    voice_id: input.voiceId ?? 'default',
    speed: input.speed ?? 1.0,
    emotion: input.emotion ?? 'neutral',
  }, 60_000);
  return (result.url as string) ?? null;
}

// ─── Video via ffmpeg Ken Burns (Node.js, no Python needed) ─────────────────

export async function generateVideoLocal(input: {
  prompt: string;
  imageUrl?: string;
  audioUrl?: string;
  duration: number;
  fps: number;
  cameraMotion?: string;
  width?: number;
  height?: number;
}): Promise<string | null> {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });

  const jobId = Date.now().toString(36);
  const outputFile = `video_${jobId}.mp4`;
  const outputPath = path.join(GENERATED_DIR, outputFile);
  const w = input.width ?? 576;
  const h = input.height ?? 1024;
  const fps = input.fps ?? 24;
  const duration = input.duration ?? 15;
  const frames = duration * fps;

  const args: string[] = ['-y'];

  let hasAudio = false;
  let audioInputIndex = 1;

  if (input.imageUrl) {
    const imagePath = resolveUrlToPath(input.imageUrl) ?? (await downloadToGenerated(input.imageUrl, `tmp_img_${jobId}.png`));
    args.push('-loop', '1', '-i', imagePath);
    if (input.audioUrl) {
      const audioPath = resolveUrlToPath(input.audioUrl) ?? (await downloadToGenerated(input.audioUrl, `tmp_audio_${jobId}.wav`));
      args.push('-i', audioPath);
      hasAudio = true;
      audioInputIndex = 1;
    }
    // Slow zoom-in Ken Burns effect
    const zoomFilter = `[0:v]scale=8000:-1,zoompan=z='zoom+0.0015':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:fps=${fps}:s=${w}x${h}[v]`;
    args.push('-filter_complex', zoomFilter, '-map', '[v]');
    if (hasAudio) args.push('-map', `${audioInputIndex}:a`);
  } else if (input.audioUrl) {
    // No image but has audio: render full waveform as static image, then Ken Burns it
    const audioPath = resolveUrlToPath(input.audioUrl) ?? (await downloadToGenerated(input.audioUrl, `tmp_audio_${jobId}.wav`));
    hasAudio = true;

    // Pass 1: render the complete waveform into a dark-background image
    const waveImgPath = path.join(GENERATED_DIR, `wave_${jobId}.png`);
    const waveH = Math.round(h * 0.35);
    const waveY = Math.round((h - waveH) / 2);
    await runProcess('ffmpeg', [
      '-y', '-i', audioPath,
      '-filter_complex',
      `color=c=0x070708:size=${w}x${h}:rate=1[bg];[0:a]volume=20,showwavespic=s=${w}x${waveH}:split_channels=0:colors=0xe8920a[wave];[bg][wave]overlay=0:${waveY}`,
      '-frames:v', '1', waveImgPath,
    ]);

    // Pass 2: Ken Burns zoom over waveform image + original audio
    args.push('-loop', '1', '-i', waveImgPath, '-i', audioPath);
    const zoomFilter = `[0:v]scale=8000:-1,zoompan=z='zoom+0.0008':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:fps=${fps}:s=${w}x${h}[v]`;
    args.push('-filter_complex', zoomFilter, '-map', '[v]', '-map', '1:a');
  } else {
    // No image, no audio: static dark background
    args.push('-f', 'lavfi', '-i', `color=c=0x070708:size=${w}x${h}:rate=${fps}`);
    args.push('-map', '0:v');
  }

  args.push('-t', String(duration), '-c:v', 'libx264', '-preset', 'fast', '-pix_fmt', 'yuv420p');
  if (hasAudio) args.push('-shortest');
  args.push(outputPath);

  await runProcess('ffmpeg', args);

  return `${BASE_URL}/generated/${outputFile}`;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

async function callInference(endpoint: string, body: unknown, timeoutMs: number): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(`${INFERENCE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!r.ok) throw new Error(`Inference server ${endpoint} failed: ${r.status} ${await r.text()}`);
    return r.json() as Promise<Record<string, unknown>>;
  } finally {
    clearTimeout(timer);
  }
}

function resolveUrlToPath(url: string): string | null {
  const prefix = `${BASE_URL}/generated/`;
  if (url.startsWith(prefix)) {
    const file = url.slice(prefix.length);
    const p = path.join(GENERATED_DIR, file);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function downloadToGenerated(url: string, filename: string): Promise<string> {
  const dest = path.join(GENERATED_DIR, filename);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Download failed: ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return dest;
}

function runProcess(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let stderr = '';
    proc.stderr?.on('data', (d) => { stderr += String(d); });
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error(`${cmd} exited ${code}: ${stderr.slice(-500)}`));
      else resolve();
    });
    proc.on('error', reject);
  });
}

export function broadcastJobUpdate(event: string, job: unknown) {
  const msg = JSON.stringify({ type: event, job });
  wsClients.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}
