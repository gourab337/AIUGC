import { useState } from 'react';
import { Send, RotateCcw, Download, ArrowRight, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ModelSelector } from '../components/ui/ModelSelector';
import { JobProgress } from '../components/ui/JobProgress';
import { useStudioStore } from '../store/studio';
import { useJobsByType } from '../hooks/useJobsByType';
import { imageApi } from '../api/client';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type AR = { label: string; w: number; h: number; desc: string; icon: string };
const ASPECT_RATIOS: AR[] = [
  { label: '9:16', w: 768,  h: 1344, desc: 'Stories / Reels',   icon: '▌' },
  { label: '1:1',  w: 1024, h: 1024, desc: 'Feed / Square',     icon: '■' },
  { label: '16:9', w: 1344, h: 768,  desc: 'YouTube / Banner',  icon: '▬' },
  { label: '4:5',  w: 896,  h: 1120, desc: 'Instagram Feed',    icon: '▐' },
];

const STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', color: '#e8920a' },
  { id: 'cinematic',      label: 'Cinematic',      color: '#00c8e0' },
  { id: 'product-shot',   label: 'Product Shot',   color: '#a78bfa' },
  { id: 'lifestyle',      label: 'Lifestyle',      color: '#34d399' },
  { id: 'editorial',      label: 'Editorial',      color: '#f472b6' },
  { id: 'neon-surreal',   label: 'Neon / Surreal', color: '#fb923c' },
] as const;

// Gradient placeholders that look like different photography styles
const PLACEHOLDER_GRADIENTS = [
  'linear-gradient(135deg, #1a0a02 0%, #4a1800 40%, #8b3a00 70%, #2a0e00 100%)',
  'linear-gradient(160deg, #030d1a 0%, #001a3a 45%, #004080 70%, #000a1a 100%)',
  'linear-gradient(120deg, #0d0a1a 0%, #1a0d2e 40%, #2d1554 70%, #0a0514 100%)',
  'linear-gradient(150deg, #0a0f0a 0%, #0d2010 40%, #1a4020 70%, #050f05 100%)',
];

type ArKey = '9:16' | '1:1' | '16:9' | '4:5';

const PLACEHOLDER_LABELS: Record<ArKey, string[]> = {
  '9:16': ['Hook frame', 'Product hero', 'Lifestyle shot', 'Close-up detail'],
  '1:1':  ['Product flat', 'Studio shot', 'Lifestyle square', 'Detail crop'],
  '16:9': ['Scene wide', 'Banner hero', 'Landscape product', 'Cinematic frame'],
  '4:5':  ['Feed card 1', 'Feed card 2', 'Brand shot', 'Mood board'],
};

export function ImageGen() {
  const navigate = useNavigate();
  const { selectedModels, addOrUpdateJob, setPendingVideoImageUrl } = useStudioStore();
  const jobs = useJobsByType('image');

  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [ar, setAr] = useState<AR>(ASPECT_RATIOS[0]);
  const [style, setStyle] = useState('photorealistic');
  const [steps, setSteps] = useState(30);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const latestJob = jobs[0];
  const showOutput = latestJob && (latestJob.status === 'completed' || latestJob.status === 'processing');
  const placeholders = PLACEHOLDER_LABELS[ar.label as ArKey];

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('Enter a visual prompt first');
    const modelId = selectedModels.image;
    if (!modelId) return toast.error('Select a model');
    setLoading(true);
    try {
      const job = await imageApi.generate({ prompt, negativePrompt, style, width: ar.w, height: ar.h, steps, modelId });
      addOrUpdateJob(job);
      toast.success('Image job queued');
    } catch {
      toast.error('Failed to queue job — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToVideo = (idx: number) => {
    setPendingVideoImageUrl(`[Image ${idx + 1} from job ${latestJob?.id?.slice(0, 8)}]`);
    navigate('/video');
    toast.success('Image sent to Video Gen');
  };

  const isPortrait = ar.label === '9:16' || ar.label === '4:5';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Image Generation" subtitle="02 — visual assets" actions={<ModelSelector step="image" />} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT ────────────────────────────── */}
        <div className="overflow-y-auto p-5 flex flex-col gap-5" style={{ width: 400, flexShrink: 0, borderRight: '1px solid var(--border)' }}>

          {/* Prompt */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Visual Prompt
            </label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="Cinematic product shot, luxury skincare bottle, bokeh background, warm amber lighting, 8K, editorial…"
              rows={5}
              className="w-full rounded border resize-none outline-none p-3 text-xs transition-colors"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', lineHeight: 1.7 }}
              onFocus={e => (e.target.style.borderColor = 'var(--cyan)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Style */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)}
                  className="px-3 py-2 rounded border text-xs transition-all text-left"
                  style={{
                    background: style === s.id ? `${s.color}14` : 'var(--bg-elevated)',
                    borderColor: style === s.id ? s.color : 'var(--border)',
                    color: style === s.id ? s.color : 'var(--text-secondary)',
                    fontFamily: 'Syne', fontWeight: style === s.id ? 700 : 400,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect ratio */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map(a => (
                <button key={a.label} onClick={() => setAr(a)}
                  className="flex items-center gap-2 px-3 py-2 rounded border text-xs transition-all"
                  style={{
                    background: ar.label === a.label ? 'rgba(0,200,224,0.08)' : 'var(--bg-elevated)',
                    borderColor: ar.label === a.label ? 'var(--cyan)' : 'var(--border)',
                    color: ar.label === a.label ? 'var(--cyan)' : 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{a.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>{a.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Negative prompt */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Negative Prompt
            </label>
            <input type="text" value={negativePrompt} onChange={e => setNegativePrompt(e.target.value)}
              placeholder="blurry, low quality, watermark, deformed, cartoon…"
              className="w-full rounded border outline-none px-3 py-2 text-xs transition-colors"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}
              onFocus={e => (e.target.style.borderColor = 'var(--cyan)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Steps */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Quality Steps — <span style={{ color: 'var(--cyan)' }}>{steps}</span>
            </label>
            <input type="range" min={10} max={60} step={5} value={steps}
              onChange={e => setSteps(Number(e.target.value))}
              className="w-full" style={{ accentColor: 'var(--cyan)' }} />
            <div className="flex justify-between mt-1">
              {[10, 20, 30, 40, 50, 60].map(v => (
                <span key={v} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: v === steps ? 'var(--cyan)' : 'var(--text-muted)' }}>{v}</span>
              ))}
            </div>
          </div>

          {/* Resolution info */}
          <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
            <ImageIcon size={11} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)' }}>
              Output: {ar.w} × {ar.h}px · {(ar.w * ar.h / 1_000_000).toFixed(1)}MP
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded flex-1 justify-center text-sm font-bold transition-all"
              style={{
                background: loading || !prompt.trim() ? 'var(--bg-elevated)' : 'var(--cyan)',
                color: loading || !prompt.trim() ? 'var(--text-muted)' : '#070708',
                cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Syne',
              }}
            >
              <Send size={13} />
              {loading ? 'Queuing…' : 'Generate'}
            </button>
            <button onClick={() => { setPrompt(''); setNegativePrompt(''); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded border transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* ── RIGHT: Gallery ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5" style={{ background: 'var(--bg-base)' }}>

          {/* Active job progress */}
          {latestJob && latestJob.status === 'processing' && (
            <div className="mb-4">
              <JobProgress job={latestJob} />
            </div>
          )}

          {showOutput ? (
            <div className="slide-in">
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Generated · {ar.label} · {style}
                </span>
                {latestJob?.status === 'completed' && Boolean(latestJob?.output?.stub) && (
                  <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(232,146,10,0.1)', fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--amber)', border: '1px solid rgba(232,146,10,0.2)' }}>
                    stub — connect a model
                  </span>
                )}
              </div>

              {/* Image grid */}
              <div className={`grid gap-3 ${isPortrait ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {PLACEHOLDER_GRADIENTS.map((grad, idx) => (
                  <div key={idx} className="group relative rounded overflow-hidden border transition-all cursor-pointer"
                    style={{ borderColor: expanded === idx ? 'var(--cyan)' : 'var(--border)', aspectRatio: isPortrait ? '3/4' : '4/3' }}
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                  >
                    {/* Gradient placeholder */}
                    <div className="absolute inset-0" style={{ background: grad }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div style={{ width: 48, height: 48, border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageIcon size={20} style={{ color: 'rgba(255,255,255,0.15)' }} />
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {placeholders[idx]}
                      </span>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <button onClick={(e) => { e.stopPropagation(); toast('Download available with real model'); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontFamily: 'Syne', border: '1px solid var(--border)' }}>
                        <Download size={10} />
                        Save
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleSendToVideo(idx); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs"
                        style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', fontFamily: 'Syne', border: '1px solid rgba(52,211,153,0.3)' }}>
                        <ArrowRight size={10} />
                        → Video
                      </button>
                    </div>

                    {/* Expand icon */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn size={12} style={{ color: 'rgba(255,255,255,0.5)' }} />
                    </div>

                    {/* Variant label */}
                    <div className="absolute bottom-2 left-2">
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: 'rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.4)', padding: '2px 5px', borderRadius: 3 }}>
                        v{idx + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk actions */}
              <div className="flex gap-2 mt-4">
                <button onClick={() => toast('Download all — available with real model')}
                  className="flex items-center gap-2 px-4 py-2 rounded border text-xs transition-all"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'Syne', fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <Download size={12} />
                  Download all
                </button>
                <button onClick={() => handleSendToVideo(0)}
                  className="flex items-center gap-2 px-4 py-2 rounded border text-xs transition-all"
                  style={{ background: 'rgba(52,211,153,0.08)', borderColor: '#34d399', color: '#34d399', fontFamily: 'Syne', fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.08)')}
                >
                  <ArrowRight size={12} />
                  Best image → Video Gen
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div style={{ fontSize: 40, opacity: 0.12 }}>🖼</div>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text-muted)' }}>
                Generated images appear here
              </p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 280, lineHeight: 1.7 }}>
                Hover over images to save or send to Video Gen.
              </p>
            </div>
          )}

          {/* History */}
          {jobs.length > 0 && (
            <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                History · {jobs.length} jobs
              </p>
              <div className="flex flex-col gap-2">
                {jobs.slice(0, 5).map(job => <JobProgress key={job.id} job={job} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
