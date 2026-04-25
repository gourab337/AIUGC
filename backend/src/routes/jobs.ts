import { Router } from 'express';
import { listJobs, getJob } from '../services/jobStore';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listJobs());
});

router.get('/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
