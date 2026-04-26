export type ModelProvider = 'local' | 'openai' | 'anthropic' | 'google' | 'replicate' | 'stability' | 'elevenlabs' | 'runway' | 'blackforestlabs' | 'midjourney' | 'fishaudio' | 'inworld' | 'xai' | 'bytedance' | 'mistral' | 'ideogram';
export type ModelQuality = 'highest' | 'very-high' | 'high';
export type WorkflowStep = 'script' | 'image' | 'voice' | 'video';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  type: WorkflowStep;
  description: string;
  available: boolean;
  quality: ModelQuality;
  pricing?: string;
  tags?: string[];
}

export interface GenerationJob {
  id: string;
  type: WorkflowStep;
  status: JobStatus;
  progress: number;
  modelId: string;
  createdAt: string;
  completedAt?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

export type UGCNiche = 'luxury-aesthetic' | 'crypto-hype' | 'ai-podcast' | 'trader-lifestyle';

export interface ProjectAsset {
  id: string;
  jobId: string;
  type: WorkflowStep;
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

export interface WSMessage {
  type: 'connected' | 'job:progress' | 'job:completed' | 'job:failed';
  job?: GenerationJob;
  message?: string;
}
