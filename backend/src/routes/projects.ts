import { Router } from 'express';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addAssetToProject,
  removeAssetFromProject,
} from '../services/projectStore';
import type { UGCNiche } from '../types';

const router = Router();

router.get('/', (_req, res) => {
  res.json(listProjects());
});

router.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.post('/', (req, res) => {
  const { name, client, niche, description } = req.body as {
    name: string;
    client: string;
    niche?: UGCNiche;
    description?: string;
  };
  if (!name || !client) return res.status(400).json({ error: 'name and client are required' });
  res.status(201).json(createProject({ name, client, niche, description }));
});

router.put('/:id', (req, res) => {
  const updated = updateProject(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Project not found' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const ok = deleteProject(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Project not found' });
  res.status(204).send();
});

router.post('/:id/assets', (req, res) => {
  const { jobId, type, experimentName, variant } = req.body as {
    jobId: string;
    type: 'script' | 'image' | 'voice' | 'video';
    experimentName?: string;
    variant?: string;
  };
  if (!jobId || !type) return res.status(400).json({ error: 'jobId and type are required' });
  const project = addAssetToProject(req.params.id, { jobId, type, experimentName, variant });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.status(201).json(project);
});

router.delete('/:id/assets/:assetId', (req, res) => {
  const project = removeAssetFromProject(req.params.id, req.params.assetId);
  if (!project) return res.status(404).json({ error: 'Project or asset not found' });
  res.json(project);
});

export default router;
