import { Router } from 'express';
import { createJob, getJob } from '../services/jobStore';
import { processJob } from '../services/mockProcessor';
import { VoiceGenerationInput } from '../types';

const router = Router();

router.post('/generate', async (req, res) => {
  const body = req.body as VoiceGenerationInput;
  if (!body.text || !body.modelId) {
    return res.status(400).json({ error: 'text and modelId are required' });
  }

  const job = createJob('voice', body.modelId, {
    ...body,
    speed: body.speed || 1.0,
    voiceId: body.voiceId || 'default',
  });
  processJob(job.id).catch(console.error);
  res.status(202).json(job);
});

router.get('/jobs/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
