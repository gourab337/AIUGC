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

export interface WSMessage {
  type: 'connected' | 'job:progress' | 'job:completed' | 'job:failed';
  job?: GenerationJob;
  message?: string;
}
