import { useState } from 'react';
import { Send, RotateCcw, Video as VideoIcon, Sparkles } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ModelSelector } from '../components/ui/ModelSelector';
import { JobProgress } from '../components/ui/JobProgress';
import { useStudioStore } from '../store/studio';
import { videoApi } from '../api/client';
import toast from 'react-hot-toast';

const DURATIONS = [3, 5, 8, 10, 15];
const FPS_OPTIONS = [12, 24, 30];

export function VideoGen() {
  const { selectedModels, addOrUpdateJob } = useStudioStore();
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [duration, setDuration] = useState(5);
  const [fps, setFps] = useState(24);
  const [loading, setLoading] = useState(false);

  const jobs = useStudioStore(s => s.jobs.filter(j => j.type === 'video'));

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('Enter a prompt first');
    const modelId = selectedModels.video;
    if (!modelId) return toast.error('Select a model');

    setLoading(true);
    try {
      const job = await videoApi.generate({ prompt, imageUrl: imageUrl || undefined, duration, fps, modelId });
      addOrUpdateJob(job);
      toast.success('Video job queued');
    } catch {
      toast.error('Failed to start generation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Video Generation"
        subtitle="04 — final composition"
        actions={<ModelSelector step="video" />}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="max-w-2xl">
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded border p-3 mb-6" style={{ background: 'rgba(52,211,153,0.05)', borderColor: 'rgba(52,211,153,0.2)' }}>
              <Sparkles size={14} style={{ color: '#34d399', marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Video generation is GPU-intensive. Recommended: NVIDIA RTX 3090+ for local models, or use a cloud provider. Optionally pass an image to use as the first frame.
              </p>
            </div>

            <div className="mb-5">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Video Prompt
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Smooth cinematic pan over a skincare product, golden hour lighting, bokeh background, luxury feel, 4K..."
                rows={5}
                className="w-full rounded border resize-none outline-none p-4 transition-colors"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontSize: 12, lineHeight: 1.7 }}
                onFocus={e => (e.target.style.borderColor = '#34d399')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div className="mb-5">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Image-to-Video (optional)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Paste an image URL or path from Image Generation..."
                className="w-full rounded border outline-none px-4 py-2.5 transition-colors"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                onFocus={e => (e.target.style.borderColor = '#34d399')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Duration */}
            <div className="mb-5">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Duration
              </label>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className="px-4 py-2 rounded border text-sm transition-all"
                    style={{
                      background: duration === d ? 'rgba(52,211,153,0.08)' : 'var(--bg-elevated)',
                      borderColor: duration === d ? '#34d399' : 'var(--border)',
                      color: duration === d ? '#34d399' : 'var(--text-secondary)',
                      fontFamily: 'Syne',
                      fontWeight: duration === d ? 700 : 400,
                    }}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* FPS */}
            <div className="mb-6">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Frame Rate
              </label>
              <div className="flex gap-2">
                {FPS_OPTIONS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFps(f)}
                    className="px-4 py-2 rounded border text-sm transition-all"
                    style={{
                      background: fps === f ? 'rgba(52,211,153,0.08)' : 'var(--bg-elevated)',
                      borderColor: fps === f ? '#34d399' : 'var(--border)',
                      color: fps === f ? '#34d399' : 'var(--text-secondary)',
                      fontFamily: 'Syne',
                      fontWeight: fps === f ? 700 : 400,
                    }}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-all"
                style={{ background: loading || !prompt.trim() ? 'var(--bg-elevated)' : '#34d399', color: loading || !prompt.trim() ? 'var(--text-muted)' : '#070708', cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Syne', fontWeight: 600 }}
              >
                <Send size={14} />
                {loading ? 'Queuing…' : 'Generate Video'}
              </button>
              <button
                onClick={() => { setPrompt(''); setImageUrl(''); }}
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
            <VideoIcon size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>VIDEO JOBS</span>
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
