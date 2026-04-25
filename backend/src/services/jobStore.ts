import { v4 as uuidv4 } from 'uuid';
import { GenerationJob } from '../types';

const jobs = new Map<string, GenerationJob>();

export function createJob(
  type: GenerationJob['type'],
  modelId: string,
  input: Record<string, unknown>
): GenerationJob {
  const job: GenerationJob = {
    id: uuidv4(),
    type,
    status: 'queued',
    progress: 0,
    modelId,
    createdAt: new Date().toISOString(),
    input,
  };
  jobs.set(job.id, job);
  return job;
}

export function updateJob(id: string, update: Partial<GenerationJob>): GenerationJob | null {
  const job = jobs.get(id);
  if (!job) return null;
  const updated = { ...job, ...update };
  jobs.set(id, updated);
  return updated;
}

export function getJob(id: string): GenerationJob | null {
  return jobs.get(id) ?? null;
}

export function listJobs(): GenerationJob[] {
  return Array.from(jobs.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
