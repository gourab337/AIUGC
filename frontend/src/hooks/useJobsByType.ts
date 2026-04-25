import { useMemo } from 'react';
import { useStudioStore } from '../store/studio';
import type { WorkflowStep } from '../types';

// Fixes Zustand v5 + React 19 infinite loop caused by .filter() creating
// a new array reference on every render inside a selector.
export function useJobsByType(type: WorkflowStep) {
  const jobs = useStudioStore(s => s.jobs);
  return useMemo(() => jobs.filter(j => j.type === type), [jobs, type]);
}
