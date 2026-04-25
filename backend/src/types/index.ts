export type ModelProvider = 'local' | 'openai' | 'anthropic' | 'replicate' | 'stability' | 'elevenlabs';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  type: 'script' | 'image' | 'voice' | 'video';
  description: string;
  available: boolean;
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

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  jobs: GenerationJob[];
  thumbnail?: string;
}

export interface ScriptGenerationInput {
  prompt: string;
  tone: 'professional' | 'casual' | 'energetic' | 'cinematic';
  duration: number;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  modelId: string;
}

export interface ImageGenerationInput {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps: number;
  modelId: string;
}

export interface VoiceGenerationInput {
  text: string;
  voiceId: string;
  speed: number;
  pitch: number;
  modelId: string;
}

export interface VideoGenerationInput {
  prompt: string;
  imageUrl?: string;
  audioUrl?: string;
  duration: number;
  fps: number;
  modelId: string;
}
