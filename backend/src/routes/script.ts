import { Router } from 'express';
import { createJob, getJob, updateJob } from '../services/jobStore';
import { processJob } from '../services/mockProcessor';
import { generateScriptWithXAI } from '../services/aiProviders';
import { generateScriptLocal, LOCAL_SCRIPT_MODELS, broadcastJobUpdate } from '../services/localProviders';
import type { ScriptGenerationInput } from '../types';

const router = Router();

const GROK_MODELS = new Set(['grok-3', 'grok-3-mini', 'grok-beta', 'grok-2']);

router.post('/generate', async (req, res) => {
  const body = req.body as ScriptGenerationInput;
  if (!body.prompt || !body.modelId) {
    return res.status(400).json({ error: 'prompt and modelId are required' });
  }

  const job = createJob('script', body.modelId, body as unknown as Record<string, unknown>);
  res.status(202).json(job);

  if (LOCAL_SCRIPT_MODELS.has(body.modelId)) {
    (async () => {
      try {
        updateJob(job.id, { status: 'processing', progress: 10 });
        broadcastJobUpdate('job:progress', { ...job, status: 'processing', progress: 10 });
        const script = await generateScriptLocal({
          prompt: body.prompt,
          tone: body.tone ?? 'cinematic',
          platform: body.platform ?? 'tiktok',
          duration: body.duration ?? 30,
          modelId: body.modelId,
          hookStyle: body.hookStyle,
          ctaStyle: body.ctaStyle,
          audience: body.audience,
        });
        if (script) {
          const done = updateJob(job.id, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            output: { script, model: body.modelId },
          });
          broadcastJobUpdate('job:completed', done);
        }
      } catch (err) {
        console.error('[local script error]', err);
        const failed = updateJob(job.id, { status: 'failed', error: String(err) });
        broadcastJobUpdate('job:failed', failed);
      }
    })();
  } else if (GROK_MODELS.has(body.modelId) && process.env.XAI_API_KEY) {
    (async () => {
      try {
        updateJob(job.id, { status: 'processing', progress: 10 });
        const script = await generateScriptWithXAI({
          prompt: body.prompt,
          tone: body.tone,
          platform: body.platform,
          duration: body.duration,
          hookStyle: body.hookStyle,
          ctaStyle: body.ctaStyle,
          audience: body.audience,
        });
        if (script) {
          updateJob(job.id, {
            status: 'completed',
            progress: 100,
            completedAt: new Date().toISOString(),
            output: { script, model: body.modelId },
          });
          return;
        }
      } catch (err) {
        console.error('[xAI script error]', err);
        updateJob(job.id, { status: 'failed', error: String(err) });
        return;
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
