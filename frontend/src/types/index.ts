export type ModelProvider = 'local' | 'openai' | 'anthropic' | 'replicate' | 'stability' | 'elevenlabs';
export type WorkflowStep = 'script' | 'image' | 'voice' | 'video';
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  type: WorkflowStep;
  description: string;
  available: boolean;
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
