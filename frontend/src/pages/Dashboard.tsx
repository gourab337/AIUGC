import { FileText, Image, Mic, Video, ArrowRight, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { useStudioStore } from '../store/studio';
import type { GenerationJob } from '../types';

const WORKFLOW = [
  { step: 'script' as const, icon: FileText, label: 'Script', desc: 'Generate marketing copy & narrative', path: '/script', color: '#e8920a' },
  { step: 'image' as const, icon: Image, label: 'Image', desc: 'Visualize scenes & product shots', path: '/image', color: '#00c8e0' },
  { step: 'voice' as const, icon: Mic, label: 'Voice', desc: 'Convert script to natural speech', path: '/voice', color: '#a78bfa' },
  { step: 'video' as const, icon: Video, label: 'Video', desc: 'Compose the final video asset', path: '/video', color: '#34d399' },
];

function StatusIcon({ status }: { status: GenerationJob['status'] }) {
  if (status === 'completed') return <CheckCircle size={12} style={{ color: 'var(--green)' }} />;
  if (status === 'failed') return <XCircle size={12} style={{ color: 'var(--red)' }} />;
  if (status === 'processing') return <Loader2 size={12} style={{ color: 'var(--amber)' }} className="animate-spin" />;
  return <Clock size={12} style={{ color: 'var(--text-muted)' }} />;
}

export function Dashboard() {
  const navigate = useNavigate();
  const jobs = useStudioStore(s => s.jobs);
  const recentJobs = jobs.slice(0, 8);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="AI UGC Studio" subtitle="marketing content pipeline" branded />

      <div className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-base)' }}>
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <h2 style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 32, color: 'var(--text-primary)', fontWeight: 400 }}>
              Create. Generate. Ship.
            </h2>
          </div>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)', maxWidth: 480 }}>
            Full-stack AI content pipeline — script → image → voice → video. Connect local or cloud models to unlock each step.
          </p>
        </div>

        {/* Workflow Pipeline */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Workflow Pipeline
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {WORKFLOW.map(({ step, icon: Icon, label, desc, path, color }, idx) => (
              <button
                key={step}
                onClick={() => navigate(path)}
                className="group text-left rounded border transition-all duration-200 p-4 relative overflow-hidden"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = color;
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                }}
              >
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={12} style={{ color }} />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>
                    0{idx + 1}
                  </span>
                  <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
                </div>

                <div
                  className="flex items-center justify-center rounded mb-3"
                  style={{ width: 36, height: 36, background: `${color}14`, border: `1px solid ${color}30` }}
                >
                  <Icon size={16} style={{ color }} />
                </div>

                <div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Recent Jobs
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)' }}>
              {jobs.length} total
            </span>
          </div>

          {recentJobs.length === 0 ? (
            <div
              className="rounded border flex flex-col items-center justify-center py-12"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', borderStyle: 'dashed' }}
            >
              <div className="text-4xl mb-3" style={{ opacity: 0.2 }}>⚡</div>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-muted)' }}>
                No jobs yet — start with Script Generation
              </p>
            </div>
          ) : (
            <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              {recentJobs.map((job, idx) => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{ borderBottom: idx < recentJobs.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <StatusIcon status={job.status} />
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-secondary)', width: 48 }}>
                    {job.type.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)', flex: 1 }}>
                    {job.id.slice(0, 8)}…
                  </span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', width: 32, textAlign: 'right' }}>
                    {job.progress}%
                  </span>
                  <div className="h-1 rounded-full overflow-hidden" style={{ width: 60, background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${job.progress}%`,
                        background: job.status === 'failed' ? 'var(--red)' : job.status === 'completed' ? 'var(--green)' : 'var(--amber)',
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>
                    {new Date(job.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
