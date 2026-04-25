import { create } from 'zustand';
import type { AIModel, GenerationJob, WorkflowStep } from '../types';

interface StudioState {
  activeStep: WorkflowStep;
  models: Record<WorkflowStep, AIModel[]>;
  selectedModels: Record<WorkflowStep, string>;
  jobs: GenerationJob[];
  wsConnected: boolean;

  setActiveStep: (step: WorkflowStep) => void;
  setModels: (type: WorkflowStep, models: AIModel[]) => void;
  setSelectedModel: (type: WorkflowStep, modelId: string) => void;
  addOrUpdateJob: (job: GenerationJob) => void;
  setJobs: (jobs: GenerationJob[]) => void;
  setWsConnected: (v: boolean) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  activeStep: 'script',
  models: { script: [], image: [], voice: [], video: [] },
  selectedModels: { script: '', image: '', voice: '', video: '' },
  jobs: [],
  wsConnected: false,

  setActiveStep: (step) => set({ activeStep: step }),
  setModels: (type, models) => set(s => ({ models: { ...s.models, [type]: models } })),
  setSelectedModel: (type, modelId) =>
    set(s => ({ selectedModels: { ...s.selectedModels, [type]: modelId } })),
  addOrUpdateJob: (job) =>
    set(s => {
      const idx = s.jobs.findIndex(j => j.id === job.id);
      if (idx >= 0) {
        const updated = [...s.jobs];
        updated[idx] = job;
        return { jobs: updated };
      }
      return { jobs: [job, ...s.jobs] };
    }),
  setJobs: (jobs) => set({ jobs }),
  setWsConnected: (v) => set({ wsConnected: v }),
}));
