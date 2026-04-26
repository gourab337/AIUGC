import { Router } from 'express';
import { createJob, getJob, updateJob } from '../services/jobStore';
import { processJob } from '../services/mockProcessor';
import { generateVoiceLocal, LOCAL_VOICE_MODELS, broadcastJobUpdate } from '../services/localProviders';
import type { VoiceGenerationInput } from '../types';

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
  res.status(202).json(job);

  if (LOCAL_VOICE_MODELS.has(body.modelId)) {
    (async () => {
      try {
        updateJob(job.id, { status: 'processing', progress: 10 });
        broadcastJobUpdate('job:progress', { ...job, status: 'processing', progress: 10 });
        const audioUrl = await generateVoiceLocal({
          text: body.text,
          voiceId: body.voiceId,
          speed: body.speed,
          emotion: body.emotion,
        });
        if (audioUrl) {
          const done = updateJob(job.id, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            output: { audioUrl, model: body.modelId },
          });
          broadcastJobUpdate('job:completed', done);
        }
      } catch (err) {
        console.error('[local voice error]', err);
        const failed = updateJob(job.id, { status: 'failed', error: String(err) });
        broadcastJobUpdate('job:failed', failed);
      }
    })();
  } else {
    processJob(job.id).catch(console.error);
  }
});

router.get('/jobs/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
