export type ModelProvider = 'local' | 'openai' | 'anthropic' | 'google' | 'replicate' | 'stability' | 'elevenlabs' | 'runway' | 'blackforestlabs' | 'midjourney' | 'fishaudio' | 'inworld' | 'xai' | 'bytedance' | 'mistral' | 'ideogram';

export type UGCNiche = 'luxury-aesthetic' | 'crypto-hype' | 'ai-podcast' | 'trader-lifestyle';

export interface ProjectAsset {
  id: string;
  jobId: string;
  type: 'script' | 'image' | 'voice' | 'video';
  experimentName?: string;
  variant?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  niche?: UGCNiche;
  description?: string;
  assets: ProjectAsset[];
  createdAt: string;
  updatedAt: string;
}
export type ModelQuality = 'highest' | 'very-high' | 'high';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  type: 'script' | 'image' | 'voice' | 'video';
  description: string;
  available: boolean;
  quality: ModelQuality;
  pricing?: string;
  tags?: string[];
}

export interface GenerationJob {
  id: string;
  type: 'script' | 'image' | 'voice' | 'video';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  modelId: string;
  createdAt: string;
  completedAt?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export interface ScriptGenerationInput {
  prompt: string;
  tone: 'professional' | 'casual' | 'energetic' | 'cinematic';
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  audience?: string;
  hookStyle?: string;
  ctaStyle?: string;
  duration: number;
  modelId: string;
}

export interface ImageGenerationInput {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  width: number;
  height: number;
  steps: number;
  modelId: string;
}

export interface VoiceGenerationInput {
  text: string;
  voiceId: string;
  speed: number;
  emotion?: string;
  modelId: string;
}

export interface VideoGenerationInput {
  prompt: string;
  imageUrl?: string;
  audioUrl?: string;
  cameraMotion?: string;
  style?: string;
  duration: number;
  fps: number;
  modelId: string;
}
