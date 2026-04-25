import { useState } from 'react';
import { Send, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ModelSelector } from '../components/ui/ModelSelector';
import { JobProgress } from '../components/ui/JobProgress';
import { useStudioStore } from '../store/studio';
import { imageApi } from '../api/client';
import toast from 'react-hot-toast';

const ASPECT_RATIOS = [
  { label: '9:16', width: 768, height: 1344, desc: 'Story / Reels' },
  { label: '1:1', width: 1024, height: 1024, desc: 'Square' },
  { label: '16:9', width: 1344, height: 768, desc: 'Landscape' },
  { label: '4:5', width: 896, height: 1120, desc: 'Instagram Feed' },
];

export function ImageGen() {
  const { selectedModels, addOrUpdateJob } = useStudioStore();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [steps, setSteps] = useState(30);
  const [loading, setLoading] = useState(false);

  const jobs = useStudioStore(s => s.jobs.filter(j => j.type === 'image'));

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('Enter a prompt first');
    const modelId = selectedModels.image;
    if (!modelId) return toast.error('Select a model');

    setLoading(true);
    try {
      const job = await imageApi.generate({
        prompt, negativePrompt,
        width: aspectRatio.width,
        height: aspectRatio.height,
        steps, modelId,
      });
      addOrUpdateJob(job);
      toast.success('Image job queued');
    } catch {
      toast.error('Failed to start generation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Image Generation"
        subtitle="02 — visual assets"
        actions={<ModelSelector step="image" />}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="max-w-2xl">
            <div className="mb-5">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Visual Prompt
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Cinematic product shot, luxury skincare bottle, bokeh background, warm amber lighting, 8k..."
                rows={5}
                className="w-full rounded border resize-none outline-none p-4 transition-colors"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontSize: 12, lineHeight: 1.7 }}
                onFocus={e => (e.target.style.borderColor = 'var(--cyan)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div className="mb-5">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Negative Prompt
              </label>
              <input
                type="text"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                placeholder="blurry, low quality, watermark, deformed..."
                className="w-full rounded border outline-none px-4 py-2.5 transition-colors"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                onFocus={e => (e.target.style.borderColor = 'var(--cyan)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Aspect Ratio */}
            <div className="mb-5">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Aspect Ratio
              </label>
              <div className="flex gap-2">
                {ASPECT_RATIOS.map(ar => (
                  <button
                    key={ar.label}
                    onClick={() => setAspectRatio(ar)}
                    className="flex flex-col items-center px-4 py-2.5 rounded border transition-all"
                    style={{
                      background: aspectRatio.label === ar.label ? 'rgba(0,200,224,0.08)' : 'var(--bg-elevated)',
                      borderColor: aspectRatio.label === ar.label ? 'var(--cyan)' : 'var(--border)',
                      color: aspectRatio.label === ar.label ? 'var(--cyan)' : 'var(--text-secondary)',
                    }}
                  >
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{ar.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{ar.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="mb-6">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Inference Steps — <span style={{ color: 'var(--cyan)' }}>{steps}</span>
              </label>
              <input
                type="range" min={10} max={60} step={5} value={steps}
                onChange={e => setSteps(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--cyan)' }}
              />
              <div className="flex justify-between mt-1">
                {[10, 20, 30, 40, 50, 60].map(v => (
                  <span key={v} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>{v}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-all"
                style={{ background: loading || !prompt.trim() ? 'var(--bg-elevated)' : 'var(--cyan)', color: loading || !prompt.trim() ? 'var(--text-muted)' : '#070708', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Syne', fontWeight: 600 }}
              >
                <Send size={14} />
                {loading ? 'Queuing…' : 'Generate Image'}
              </button>
              <button
                onClick={() => setPrompt('')}
                className="flex items-center gap-2 px-4 py-2.5 rounded text-sm transition-all"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontFamily: 'Syne' }}
              >
                <RotateCcw size={13} />
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="w-72 overflow-y-auto p-4" style={{ background: 'var(--bg-surface)', flexShrink: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>IMAGE JOBS</span>
            <span className="ml-auto" style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)' }}>{jobs.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {jobs.length === 0 ? (
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 24 }}>No jobs yet</p>
            ) : (
              jobs.map(job => <JobProgress key={job.id} job={job} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
