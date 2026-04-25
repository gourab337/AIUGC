import { useEffect } from 'react';
import { useStudioStore } from '../store/studio';
import { modelsApi } from '../api/client';
import type { WorkflowStep } from '../types';

const STEPS: WorkflowStep[] = ['script', 'image', 'voice', 'video'];

export function useModels() {
  const { setModels, setSelectedModel, models } = useStudioStore();

  useEffect(() => {
    STEPS.forEach(async (step) => {
      try {
        const data = await modelsApi.getByType(step);
        setModels(step, data);
        if (data.length > 0) setSelectedModel(step, data[0].id);
      } catch {}
    });
  }, []);

  return models;
}
