import { Router } from 'express';
import { createJob, getJob, updateJob } from '../services/jobStore';
import { processJob } from '../services/mockProcessor';
import { generateVideoLocal, LOCAL_VIDEO_MODELS, broadcastJobUpdate } from '../services/localProviders';
import type { VideoGenerationInput } from '../types';

const router = Router();

router.post('/generate', async (req, res) => {
  const body = req.body as VideoGenerationInput;
  if (!body.prompt || !body.modelId) {
    return res.status(400).json({ error: 'prompt and modelId are required' });
  }

  const job = createJob('video', body.modelId, {
    ...body,
    duration: body.duration || 15,
    fps: body.fps || 24,
  });
  res.status(202).json(job);

  if (LOCAL_VIDEO_MODELS.has(body.modelId)) {
    (async () => {
      try {
        updateJob(job.id, { status: 'processing', progress: 10 });
        broadcastJobUpdate('job:progress', { ...job, status: 'processing', progress: 10 });
        const videoUrl = await generateVideoLocal({
          prompt: body.prompt,
          imageUrl: body.imageUrl,
          audioUrl: body.audioUrl,
          duration: body.duration || 15,
          fps: body.fps || 24,
          cameraMotion: body.cameraMotion,
        });
        if (videoUrl) {
          const done = updateJob(job.id, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            output: { videoUrl, model: body.modelId },
          });
          broadcastJobUpdate('job:completed', done);
        }
      } catch (err) {
        console.error('[local video error]', err);
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
