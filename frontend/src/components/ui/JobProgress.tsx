import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import type { GenerationJob } from '../../types';
import clsx from 'clsx';

interface Props {
  job: GenerationJob;
}

const STATUS_CONFIG = {
  queued: { icon: Clock, color: 'var(--text-muted)', label: 'Queued' },
  processing: { icon: Loader2, color: 'var(--amber)', label: 'Processing' },
  completed: { icon: CheckCircle, color: 'var(--green)', label: 'Done' },
  failed: { icon: XCircle, color: 'var(--red)', label: 'Failed' },
};

export function JobProgress({ job }: Props) {
  const cfg = STATUS_CONFIG[job.status];
  const Icon = cfg.icon;

  return (
    <div
      className="rounded border p-3 slide-in"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon
          size={14}
          style={{ color: cfg.color }}
          className={clsx(job.status === 'processing' && 'animate-spin')}
        />
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          {job.type.toUpperCase()} · {cfg.label}
        </span>
        <span className="text-xs font-mono ml-auto" style={{ color: 'var(--text-muted)' }}>
          {job.progress}%
        </span>
      </div>

      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className={clsx('h-full rounded-full transition-all duration-300', job.status === 'processing' && 'progress-stripe')}
          style={{
            width: `${job.progress}%`,
            background: job.status === 'failed' ? 'var(--red)' : job.status === 'completed' ? 'var(--green)' : 'var(--amber)',
          }}
        />
      </div>

      {job.status === 'completed' && Boolean(job.output?.stub) && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
          Stub output — connect a model to generate real content
        </p>
      )}
    </div>
  );
}
