#!/usr/bin/env node
/**
 * UGCC MCP Server — exposes the AI UGC Studio workflow as Claude Code tools.
 * Configured via .mcp.json in the project root.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const API = process.env.UGCC_API_URL ?? 'http://localhost:3001';

// ─── helpers ────────────────────────────────────────────────────────────────

async function post(path: string, body: unknown) {
  const r = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${path} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function get(path: string) {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(`${path} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

async function waitForJob(jobId: string, timeoutMs = 360_000): Promise<Record<string, unknown>> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await get(`/api/jobs/${jobId}`) as Record<string, unknown>;
    if (job.status === 'completed') return job;
    if (job.status === 'failed') throw new Error(`Job ${jobId} failed: ${job.error}`);
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Job ${jobId} timed out after ${timeoutMs}ms`);
}

function modelFor(step: string, model?: string): string {
  const defaults: Record<string, string> = {
    script: 'qwen2.5-7b-local',
    image: 'flux-schnell-local',
    voice: 'kokoro-82m-local',
    video: 'ltx-2-3-local',
  };
  return model ?? defaults[step] ?? step;
}

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

// ─── server ─────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'ugcc-studio',
  version: '1.0.0',
});

// list models
server.tool('ugcc_list_models', 'List available AI models per workflow step', {
  step: z.enum(['script', 'image', 'voice', 'video', 'all']).optional().describe('Workflow step to list models for'),
}, async ({ step }) => {
  const types = step === 'all' || !step ? ['script', 'image', 'voice', 'video'] : [step];
  const results: string[] = [];
  for (const t of types) {
    const models = await get(`/api/models/${t}`) as Array<{ id: string; name: string; provider: string; pricing?: string }>;
    results.push(`\n${t.toUpperCase()}:`);
    models.forEach(m => results.push(`  • ${m.id} — ${m.name} (${m.provider}) ${m.pricing ?? ''}`));
  }
  return ok(results.join('\n'));
});

// script
server.tool('ugcc_generate_script', 'Generate a UGC marketing script', {
  prompt: z.string().describe('What the video is about'),
  tone: z.enum(['cinematic', 'energetic', 'casual', 'professional']).optional().default('cinematic'),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'twitter']).optional().default('tiktok'),
  duration: z.number().optional().default(30).describe('Duration in seconds'),
  niche: z.enum(['luxury-aesthetic', 'crypto-hype', 'ai-podcast', 'trader-lifestyle']).optional(),
  model: z.string().optional().describe('Model ID, e.g. grok-3'),
}, async ({ prompt, tone, platform, duration, niche, model }) => {
  const job = await post('/api/script/generate', {
    prompt,
    tone,
    platform,
    duration,
    modelId: modelFor('script', model),
    hookStyle: niche ? 'Shocking stat' : undefined,
  }) as { id: string };
  const done = await waitForJob(job.id);
  const out = done.output as Record<string, unknown> ?? {};
  return ok(`Script generated (job: ${job.id})\n\n${out.script ?? JSON.stringify(out, null, 2)}`);
});

// image
server.tool('ugcc_generate_image', 'Generate an image for the UGC content', {
  prompt: z.string().describe('Image description'),
  style: z.string().optional().default('cinematic').describe('e.g. cinematic, editorial, neon-surreal'),
  aspectRatio: z.string().optional().default('9:16').describe('e.g. 9:16, 1:1, 4:5'),
  model: z.string().optional().describe('Model ID, e.g. grok-aurora, flux-2-pro'),
}, async ({ prompt, style, aspectRatio, model }) => {
  const [wStr, hStr] = (aspectRatio ?? '9:16').split(':');
  const ratio = parseInt(wStr) / parseInt(hStr);
  const h = 1024, w = Math.round(h * ratio);
  const job = await post('/api/image/generate', {
    prompt,
    style,
    width: w,
    height: h,
    steps: 30,
    modelId: modelFor('image', model),
  }) as { id: string };
  const done = await waitForJob(job.id);
  const out = done.output as Record<string, unknown> ?? {};
  return ok(`Image generated (job: ${job.id})\nURL: ${out.imageUrl ?? 'mock://generated-image'}\n${JSON.stringify(out, null, 2)}`);
});

// voice
server.tool('ugcc_generate_voice', 'Convert script text to voice audio', {
  text: z.string().describe('Script text to speak'),
  voice: z.string().optional().default('default').describe('Voice ID e.g. nova, alloy, echo'),
  emotion: z.enum(['neutral', 'excited', 'calm', 'authoritative', 'dramatic']).optional().default('neutral'),
  model: z.string().optional().describe('Model ID, e.g. fish-audio-s2, elevenlabs-turbo-v3'),
}, async ({ text, voice, emotion, model }) => {
  const job = await post('/api/voice/generate', {
    text,
    voiceId: voice,
    speed: 1.0,
    emotion,
    modelId: modelFor('voice', model),
  }) as { id: string };
  const done = await waitForJob(job.id);
  const out = done.output as Record<string, unknown> ?? {};
  return ok(`Voice generated (job: ${job.id})\nAudio: ${out.audioUrl ?? 'mock://generated-audio'}\n${JSON.stringify(out, null, 2)}`);
});

// video
server.tool('ugcc_generate_video', 'Generate the final video from image + audio', {
  prompt: z.string().describe('Video scene description'),
  imageUrl: z.string().optional().describe('Source image URL from ugcc_generate_image'),
  audioUrl: z.string().optional().describe('Source audio URL from ugcc_generate_voice'),
  duration: z.number().optional().default(15),
  cameraMotion: z.string().optional().default('slow-pan'),
  style: z.string().optional().default('cinematic'),
  model: z.string().optional().describe('Model ID, e.g. grok-imagine-video, runway-gen4-5'),
}, async ({ prompt, imageUrl, audioUrl, duration, cameraMotion, style, model }) => {
  const job = await post('/api/video/generate', {
    prompt,
    imageUrl,
    audioUrl,
    duration,
    fps: 24,
    cameraMotion,
    style,
    modelId: modelFor('video', model),
  }) as { id: string };
  const done = await waitForJob(job.id);
  const out = done.output as Record<string, unknown> ?? {};
  return ok(`Video generated (job: ${job.id})\nVideo: ${out.videoUrl ?? 'mock://generated-video'}\n${JSON.stringify(out, null, 2)}`);
});

// full pipeline
server.tool('ugcc_full_workflow', 'Run the complete UGC pipeline: script → image → voice → video', {
  concept: z.string().describe('The video concept or brief, e.g. "monkey jumping in water for Instagram Reel"'),
  platform: z.enum(['tiktok', 'instagram', 'youtube', 'twitter']).optional().default('instagram'),
  duration: z.number().optional().default(15),
  niche: z.enum(['luxury-aesthetic', 'crypto-hype', 'ai-podcast', 'trader-lifestyle']).optional(),
  model: z.string().optional().describe('Use one model for all steps, e.g. "grok-3" for script + "grok-aurora" for image'),
  scriptModel: z.string().optional(),
  imageModel: z.string().optional(),
  voiceModel: z.string().optional(),
  videoModel: z.string().optional(),
  projectName: z.string().optional().describe('Save all assets to this project name'),
}, async ({ concept, platform, duration, niche, model, scriptModel, imageModel, voiceModel, videoModel, projectName }) => {
  const steps: string[] = [];
  const log = (msg: string) => steps.push(msg);

  log(`Starting full UGC workflow for: "${concept}"`);
  log(`Platform: ${platform} | Duration: ${duration}s${niche ? ` | Niche: ${niche}` : ''}`);
  log('─'.repeat(50));

  // Create project if named
  let projectId: string | undefined;
  if (projectName) {
    const proj = await post('/api/projects', {
      name: projectName,
      client: 'loafmarkets.com',
      niche,
    }) as { id: string };
    projectId = proj.id;
    log(`✓ Project created: ${projectName} (${projectId})`);
  }

  // Step 1: Script
  log('\n[1/4] Generating script...');
  const scriptJob = await post('/api/script/generate', {
    prompt: concept,
    tone: niche === 'luxury-aesthetic' ? 'cinematic' : niche === 'crypto-hype' ? 'energetic' : 'cinematic',
    platform,
    duration,
    modelId: modelFor('script', scriptModel ?? model),
  }) as { id: string };
  const scriptDone = await waitForJob(scriptJob.id);
  const scriptOut = scriptDone.output as Record<string, unknown>;
  const scriptText = String(scriptOut?.script ?? concept);
  log(`✓ Script complete (job: ${scriptJob.id})`);

  // Step 2: Image
  log('\n[2/4] Generating image...');
  const imageJob = await post('/api/image/generate', {
    prompt: concept,
    style: niche === 'luxury-aesthetic' ? 'editorial' : 'cinematic',
    width: 576, height: 1024,
    steps: 30,
    modelId: modelFor('image', imageModel ?? model),
  }) as { id: string };
  const imageDone = await waitForJob(imageJob.id);
  const imageOut = imageDone.output as Record<string, unknown>;
  const imageUrl = String(imageOut?.imageUrl ?? 'mock://image');
  log(`✓ Image complete (job: ${imageJob.id}) → ${imageUrl}`);

  // Step 3: Voice
  log('\n[3/4] Generating voice-over...');
  const voiceJob = await post('/api/voice/generate', {
    text: scriptText,
    voiceId: 'default',
    speed: 1.0,
    emotion: 'calm',
    modelId: modelFor('voice', voiceModel ?? model),
  }) as { id: string };
  const voiceDone = await waitForJob(voiceJob.id);
  const voiceOut = voiceDone.output as Record<string, unknown>;
  const audioUrl = String(voiceOut?.audioUrl ?? 'mock://audio');
  log(`✓ Voice complete (job: ${voiceJob.id}) → ${audioUrl}`);

  // Step 4: Video
  log('\n[4/4] Generating video...');
  const videoJob = await post('/api/video/generate', {
    prompt: concept,
    imageUrl,
    audioUrl,
    duration,
    fps: 24,
    cameraMotion: 'slow-pan',
    style: 'cinematic',
    modelId: modelFor('video', videoModel ?? model),
  }) as { id: string };
  const videoDone = await waitForJob(videoJob.id);
  const videoOut = videoDone.output as Record<string, unknown>;
  const videoUrl = String(videoOut?.videoUrl ?? 'mock://video');
  log(`✓ Video complete (job: ${videoJob.id}) → ${videoUrl}`);

  // Save assets to project
  if (projectId) {
    await post(`/api/projects/${projectId}/assets`, { jobId: scriptJob.id, type: 'script' });
    await post(`/api/projects/${projectId}/assets`, { jobId: imageJob.id, type: 'image' });
    await post(`/api/projects/${projectId}/assets`, { jobId: voiceJob.id, type: 'voice' });
    await post(`/api/projects/${projectId}/assets`, { jobId: videoJob.id, type: 'video' });
    log(`\n✓ All assets saved to project "${projectName}"`);
  }

  log('\n' + '═'.repeat(50));
  log('WORKFLOW COMPLETE');
  log(`Script: ${scriptJob.id}`);
  log(`Image:  ${imageUrl}`);
  log(`Audio:  ${audioUrl}`);
  log(`Video:  ${videoUrl}`);

  return ok(steps.join('\n'));
});

// project tools
server.tool('ugcc_create_project', 'Create a new UGC project', {
  name: z.string(),
  client: z.string().optional().default('loafmarkets.com'),
  niche: z.enum(['luxury-aesthetic', 'crypto-hype', 'ai-podcast', 'trader-lifestyle']).optional(),
}, async ({ name, client, niche }) => {
  const proj = await post('/api/projects', { name, client, niche }) as { id: string; name: string };
  return ok(`Project created: "${proj.name}" (${proj.id})`);
});

server.tool('ugcc_list_projects', 'List all UGC projects', {}, async () => {
  const projects = await get('/api/projects') as Array<{ id: string; name: string; client: string; niche?: string; assets: unknown[] }>;
  if (!projects.length) return ok('No projects yet.');
  return ok(projects.map(p =>
    `• ${p.name} [${p.client}]${p.niche ? ` (${p.niche})` : ''} — ${p.assets.length} assets  id: ${p.id}`
  ).join('\n'));
});

server.tool('ugcc_get_job', 'Get the status and output of a job', {
  jobId: z.string(),
}, async ({ jobId }) => {
  const job = await get(`/api/jobs/${jobId}`) as Record<string, unknown>;
  return ok(JSON.stringify(job, null, 2));
});

// ─── run ─────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
