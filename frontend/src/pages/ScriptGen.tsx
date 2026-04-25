import { useState } from 'react';
import { Send, RotateCcw, FileText } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ModelSelector } from '../components/ui/ModelSelector';
import { JobProgress } from '../components/ui/JobProgress';
import { useStudioStore } from '../store/studio';
import { scriptApi } from '../api/client';
import toast from 'react-hot-toast';

const TONES = ['professional', 'casual', 'energetic', 'cinematic'] as const;
const PLATFORMS = ['tiktok', 'instagram', 'youtube', 'twitter'] as const;

export function ScriptGen() {
  const { selectedModels, addOrUpdateJob } = useStudioStore();
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<typeof TONES[number]>('energetic');
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>('tiktok');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);

  const jobs = useStudioStore(s => s.jobs.filter(j => j.type === 'script'));

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('Enter a prompt first');
    const modelId = selectedModels.script;
    if (!modelId) return toast.error('Select a model');

    setLoading(true);
    try {
      const job = await scriptApi.generate({ prompt, tone, platform, duration, modelId });
      addOrUpdateJob(job);
      toast.success('Script job queued');
    } catch {
      toast.error('Failed to start generation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Script Generation"
        subtitle="01 — narrative & copy"
        actions={<ModelSelector step="script" />}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main input */}
        <div className="flex-1 overflow-y-auto p-6" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="max-w-2xl">
            <div className="mb-6">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Campaign Brief
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe the product, audience, and key message. e.g. 'Skincare brand targeting gen-z, emphasize natural ingredients and glow-up transformation...'"
                rows={6}
                className="w-full rounded border resize-none outline-none transition-colors duration-200 p-4 text-sm"
                style={{
                  background: 'var(--bg-elevated)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 12,
                  lineHeight: 1.7,
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Tone */}
            <div className="mb-5">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Tone
              </label>
              <div className="flex gap-2">
                {TONES.map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className="px-3 py-1.5 rounded text-xs transition-all duration-150"
                    style={{
                      fontFamily: 'JetBrains Mono',
                      background: tone === t ? 'var(--amber)' : 'var(--bg-elevated)',
                      color: tone === t ? '#070708' : 'var(--text-secondary)',
                      border: `1px solid ${tone === t ? 'var(--amber)' : 'var(--border)'}`,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div className="mb-5">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Platform
              </label>
              <div className="flex gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className="px-3 py-1.5 rounded text-xs transition-all duration-150"
                    style={{
                      fontFamily: 'JetBrains Mono',
                      background: platform === p ? 'var(--cyan)' : 'var(--bg-elevated)',
                      color: platform === p ? '#070708' : 'var(--text-secondary)',
                      border: `1px solid ${platform === p ? 'var(--cyan)' : 'var(--border)'}`,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-6">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Duration — <span style={{ color: 'var(--amber)' }}>{duration}s</span>
              </label>
              <input
                type="range"
                min={15}
                max={180}
                step={15}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--amber)' }}
              />
              <div className="flex justify-between mt-1">
                {[15, 30, 60, 90, 120, 180].map(v => (
                  <span key={v} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>{v}s</span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded transition-all duration-200 text-sm font-medium"
                style={{
                  background: loading || !prompt.trim() ? 'var(--bg-elevated)' : 'var(--amber)',
                  color: loading || !prompt.trim() ? 'var(--text-muted)' : '#070708',
                  cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'Syne',
                  fontWeight: 600,
                }}
              >
                <Send size={14} />
                {loading ? 'Queuing…' : 'Generate Script'}
              </button>
              <button
                onClick={() => setPrompt('')}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-sm transition-all"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontFamily: 'Syne' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <RotateCcw size={13} />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Right panel: jobs */}
        <div className="w-72 overflow-y-auto p-4" style={{ background: 'var(--bg-surface)', flexShrink: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              SCRIPT JOBS
            </span>
            <span className="ml-auto" style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)' }}>
              {jobs.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {jobs.length === 0 ? (
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 24 }}>
                No jobs yet
              </p>
            ) : (
              jobs.map(job => <JobProgress key={job.id} job={job} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
