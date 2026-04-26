import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIModel, GenerationJob, Project, WorkflowStep } from '../types';

interface StudioState {
  models: Record<WorkflowStep, AIModel[]>;
  selectedModels: Record<WorkflowStep, string>;
  jobs: GenerationJob[];
  wsConnected: boolean;

  // Cross-step data passing
  pendingVoiceText: string;
  pendingVideoImageUrl: string;
  pendingVideoAudioUrl: string;

  // Project management
  projects: Project[];
  activeProjectId: string | null;

  setModels: (type: WorkflowStep, models: AIModel[]) => void;
  setSelectedModel: (type: WorkflowStep, modelId: string) => void;
  addOrUpdateJob: (job: GenerationJob) => void;
  setJobs: (jobs: GenerationJob[]) => void;
  setWsConnected: (v: boolean) => void;
  setPendingVoiceText: (text: string) => void;
  setPendingVideoImageUrl: (url: string) => void;
  setPendingVideoAudioUrl: (url: string) => void;

  setProjects: (projects: Project[]) => void;
  addOrUpdateProject: (project: Project) => void;
  removeProject: (id: string) => void;
  setActiveProjectId: (id: string | null) => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      models: { script: [], image: [], voice: [], video: [] },
      selectedModels: { script: '', image: '', voice: '', video: '' },
      jobs: [],
      wsConnected: false,
      pendingVoiceText: '',
      pendingVideoImageUrl: '',
      pendingVideoAudioUrl: '',
      projects: [],
      activeProjectId: null,

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
      setPendingVoiceText: (text) => set({ pendingVoiceText: text }),
      setPendingVideoImageUrl: (url) => set({ pendingVideoImageUrl: url }),
      setPendingVideoAudioUrl: (url) => set({ pendingVideoAudioUrl: url }),

      setProjects: (projects) => set({ projects }),
      addOrUpdateProject: (project) =>
        set(s => {
          const idx = s.projects.findIndex(p => p.id === project.id);
          if (idx >= 0) {
            const updated = [...s.projects];
            updated[idx] = project;
            return { projects: updated };
          }
          return { projects: [project, ...s.projects] };
        }),
      removeProject: (id) =>
        set(s => ({
          projects: s.projects.filter(p => p.id !== id),
          activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
        })),
      setActiveProjectId: (id) => set({ activeProjectId: id }),
    }),
    {
      name: 'aiugc-studio',
      partialize: (s) => ({
        selectedModels: s.selectedModels,
        activeProjectId: s.activeProjectId,
      }),
    }
  )
);
