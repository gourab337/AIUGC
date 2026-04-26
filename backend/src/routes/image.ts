import { Router } from 'express';
import { createJob, getJob, updateJob } from '../services/jobStore';
import { processJob } from '../services/mockProcessor';
import { generateImageLocal, LOCAL_IMAGE_MODELS, broadcastJobUpdate } from '../services/localProviders';
import type { ImageGenerationInput } from '../types';

const router = Router();

router.post('/generate', async (req, res) => {
  const body = req.body as ImageGenerationInput;
  if (!body.prompt || !body.modelId) {
    return res.status(400).json({ error: 'prompt and modelId are required' });
  }

  const job = createJob('image', body.modelId, {
    ...body,
    width: body.width || 576,
    height: body.height || 1024,
    steps: body.steps || 4,
  });
  res.status(202).json(job);

  if (LOCAL_IMAGE_MODELS.has(body.modelId)) {
    (async () => {
      try {
        updateJob(job.id, { status: 'processing', progress: 5 });
        broadcastJobUpdate('job:progress', { ...job, status: 'processing', progress: 5 });
        const imageUrls = await generateImageLocal({
          prompt: body.prompt,
          style: body.style,
          width: body.width || 576,
          height: body.height || 1024,
          steps: body.steps || 20,
          modelId: body.modelId,
        });
        if (imageUrls && imageUrls.length > 0) {
          const done = updateJob(job.id, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            output: { imageUrls, imageUrl: imageUrls[0], model: body.modelId },
          });
          broadcastJobUpdate('job:completed', done);
        }
      } catch (err) {
        console.error('[local image error]', err);
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
