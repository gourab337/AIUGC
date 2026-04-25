import { updateJob } from './jobStore';
import { wsClients } from '../wsClients';

// Simulates AI processing with progress updates — replace with real model calls
export async function processJob(jobId: string): Promise<void> {
  const steps = 10;

  for (let i = 1; i <= steps; i++) {
    await sleep(300 + Math.random() * 200);
    const progress = Math.round((i / steps) * 100);
    const updated = updateJob(jobId, { status: 'processing', progress });
    broadcast({ type: 'job:progress', job: updated });
  }

  // Stub outputs — real models will populate these
  const job = updateJob(jobId, {
    status: 'completed',
    progress: 100,
    completedAt: new Date().toISOString(),
    output: getStubOutput(jobId),
  });

  broadcast({ type: 'job:completed', job });
}

function getStubOutput(jobId: string): Record<string, unknown> {
  return {
    jobId,
    note: 'Model not connected. Add API key or configure local model to generate real output.',
    stub: true,
  };
}

function broadcast(data: unknown) {
  const msg = JSON.stringify(data);
  wsClients.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
