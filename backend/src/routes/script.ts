import { Router } from 'express';
import { createJob, getJob } from '../services/jobStore';
import { processJob } from '../services/mockProcessor';
import { ScriptGenerationInput } from '../types';

const router = Router();

router.post('/generate', async (req, res) => {
  const body = req.body as ScriptGenerationInput;
  if (!body.prompt || !body.modelId) {
    return res.status(400).json({ error: 'prompt and modelId are required' });
  }

  const job = createJob('script', body.modelId, body as unknown as Record<string, unknown>);
  processJob(job.id).catch(console.error);
  res.status(202).json(job);
});

router.get('/jobs/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
