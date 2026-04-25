import { Router } from 'express';
import { getAllModels, getModelsByType } from '../services/modelRegistry';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getAllModels());
});

router.get('/:type', (req, res) => {
  const { type } = req.params;
  const valid = ['script', 'image', 'voice', 'video'];
  if (!valid.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${valid.join(', ')}` });
  }
  res.json(getModelsByType(type as 'script' | 'image' | 'voice' | 'video'));
});

export default router;
