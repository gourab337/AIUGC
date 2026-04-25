import { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, Download, Play, Pause, Video as VideoIcon, Sparkles, Link, Mic, Image as ImageIcon } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ModelSelector } from '../components/ui/ModelSelector';
import { JobProgress } from '../components/ui/JobProgress';
import { useStudioStore } from '../store/studio';
import { useJobsByType } from '../hooks/useJobsByType';
import { videoApi } from '../api/client';
import toast from 'react-hot-toast';

const DURATIONS = [3, 5, 8, 10, 15] as const;
const FPS_OPTIONS = [12, 24, 30] as const;
const ASPECT_RATIOS = [
  { label: '9:16', desc: 'Vertical' },
  { label: '1:1',  desc: 'Square' },
  { label: '16:9', desc: 'Widescreen' },
];
type AspectRatio = { label: string; desc: string };
const CAMERA_MOTIONS = ['Static', 'Slow pan', 'Zoom in', 'Orbit', 'Dolly', 'Handheld'];
const VIDEO_STYLES = [
  { id: 'ugc-authentic', label: 'UGC Authentic', color: '#e8920a' },
  { id: 'cinematic',     label: 'Cinematic',     color: '#00c8e0' },
  { id: 'fast-cut',      label: 'Fast Cut',      color: '#ff4455' },
  { id: 'slideshow',     label: 'Slideshow',     color: '#34d399' },
] as const;

const TIMELINE_FRAMES = 20;

export function VideoGen() {
  const { selectedModels, addOrUpdateJob, pendingVideoImageUrl, pendingVideoAudioUrl, setPendingVideoImageUrl, setPendingVideoAudioUrl } = useStudioStore();
  const jobs = useJobsByType('video');

  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [duration, setDuration] = useState<typeof DURATIONS[number]>(5);
  const [fps, setFps] = useState<typeof FPS_OPTIONS[number]>(24);
  const [ar, setAr] = useState<AspectRatio>(ASPECT_RATIOS[0]);
  const [motion, setMotion] = useState('Static');
  const [vStyle, setVStyle] = useState('ugc-authentic');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const latestJob = jobs[0];
  const showOutput = latestJob && (latestJob.status === 'completed' || latestJob.status === 'processing');

  // Accept cross-step data
  useEffect(() => {
    if (pendingVideoImageUrl) { setImageUrl(pendingVideoImageUrl); setPendingVideoImageUrl(''); }
  }, [pendingVideoImageUrl, setPendingVideoImageUrl]);
  useEffect(() => {
    if (pendingVideoAudioUrl) { setAudioUrl(pendingVideoAudioUrl); setPendingVideoAudioUrl(''); }
  }, [pendingVideoAudioUrl, setPendingVideoAudioUrl]);

  // Fake playback
  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setPlayProgress(p => {
          if (p >= 1) { setPlaying(false); clearInterval(playRef.current!); return 0; }
          return p + (1 / (duration * 20));
        });
      }, 50);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, duration]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('Enter a video prompt first');
    const modelId = selectedModels.video;
    if (!modelId) return toast.error('Select a model');
    setLoading(true);
    try {
      const job = await videoApi.generate({ prompt, imageUrl: imageUrl || undefined, audioUrl: audioUrl || undefined, cameraMotion: motion, style: vStyle, duration, fps, modelId });
      addOrUpdateJob(job);
      toast.success('Video job queued');
    } catch {
      toast.error('Failed to queue job — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!showOutput) return;
    if (playProgress >= 1) setPlayProgress(0);
    setPlaying(p => !p);
  };

  const formatTime = (frac: number) => {
    const secs = frac * duration;
    return `${Math.floor(secs)}:${String(Math.round((secs % 1) * 10)).padStart(2, '0')}`;
  };

  const isVertical = ar.label === '9:16';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Video Generation" subtitle="04 — final composition" actions={<ModelSelector step="video" />} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT ─────────────────────────────── */}
        <div className="overflow-y-auto p-5 flex flex-col gap-5" style={{ width: 400, flexShrink: 0, borderRight: '1px solid var(--border)' }}>

          {/* Info */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded border" style={{ background: 'rgba(52,211,153,0.04)', borderColor: 'rgba(52,211,153,0.15)' }}>
            <Sparkles size={11} style={{ color: '#34d399', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              GPU-intensive. RTX 3090+ for local models, or connect a cloud provider. Optionally pipe in an image + audio from previous steps.
            </p>
          </div>

          {/* Prompt */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Video Prompt
            </label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
              placeholder="Smooth cinematic pan over a skincare product, golden hour lighting, bokeh background, luxury feel…"
              rows={4}
              className="w-full rounded border resize-none outline-none p-3 text-xs transition-colors"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', lineHeight: 1.7 }}
              onFocus={e => (e.target.style.borderColor = '#34d399')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Image input */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Image-to-Video <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <div className="relative">
              <ImageIcon size={11} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                placeholder="Paste image URL or use ← from Image Gen…"
                className="w-full rounded border outline-none pl-8 pr-3 py-2 text-xs transition-colors"
                style={{ background: imageUrl ? 'rgba(52,211,153,0.05)' : 'var(--bg-elevated)', borderColor: imageUrl ? '#34d399' : 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}
                onFocus={e => (e.target.style.borderColor = '#34d399')}
                onBlur={e => (e.target.style.borderColor = imageUrl ? '#34d399' : 'var(--border)')}
              />
              {imageUrl && <button onClick={() => setImageUrl('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>✕</button>}
            </div>
          </div>

          {/* Audio input */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Audio Track <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <div className="relative">
              <Mic size={11} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" value={audioUrl} onChange={e => setAudioUrl(e.target.value)}
                placeholder="Paste audio URL or use ← from Voice Gen…"
                className="w-full rounded border outline-none pl-8 pr-3 py-2 text-xs transition-colors"
                style={{ background: audioUrl ? 'rgba(167,139,250,0.05)' : 'var(--bg-elevated)', borderColor: audioUrl ? '#a78bfa' : 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}
                onFocus={e => (e.target.style.borderColor = '#a78bfa')}
                onBlur={e => (e.target.style.borderColor = audioUrl ? '#a78bfa' : 'var(--border)')}
              />
              {audioUrl && <button onClick={() => setAudioUrl('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>✕</button>}
            </div>
          </div>

          {/* Video style */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Video Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VIDEO_STYLES.map(s => (
                <button key={s.id} onClick={() => setVStyle(s.id)}
                  className="px-3 py-2 rounded border text-xs transition-all text-left"
                  style={{
                    background: vStyle === s.id ? `${s.color}14` : 'var(--bg-elevated)',
                    borderColor: vStyle === s.id ? s.color : 'var(--border)',
                    color: vStyle === s.id ? s.color : 'var(--text-secondary)',
                    fontFamily: 'Syne', fontWeight: vStyle === s.id ? 700 : 400,
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
            <div className="flex gap-2">
              {ASPECT_RATIOS.map(a => (
                <button key={a.label} onClick={() => setAr(a)}
                  className="flex flex-col items-center px-4 py-2 rounded border transition-all"
                  style={{
                    background: ar.label === a.label ? 'rgba(52,211,153,0.08)' : 'var(--bg-elevated)',
                    borderColor: ar.label === a.label ? '#34d399' : 'var(--border)',
                    color: ar.label === a.label ? '#34d399' : 'var(--text-secondary)',
                  }}
                >
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{a.label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>{a.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Camera motion */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Camera Motion
            </label>
            <div className="flex flex-wrap gap-2">
              {CAMERA_MOTIONS.map(m => (
                <button key={m} onClick={() => setMotion(m)}
                  className="px-2.5 py-1 rounded border text-xs transition-all"
                  style={{
                    background: motion === m ? 'rgba(52,211,153,0.08)' : 'var(--bg-elevated)',
                    borderColor: motion === m ? '#34d399' : 'var(--border)',
                    color: motion === m ? '#34d399' : 'var(--text-secondary)',
                    fontFamily: 'JetBrains Mono',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & FPS */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Duration
              </label>
              <div className="flex gap-1.5">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className="flex-1 py-1.5 rounded border text-xs transition-all"
                    style={{
                      background: duration === d ? 'rgba(52,211,153,0.08)' : 'var(--bg-elevated)',
                      borderColor: duration === d ? '#34d399' : 'var(--border)',
                      color: duration === d ? '#34d399' : 'var(--text-secondary)',
                      fontFamily: 'Syne', fontWeight: duration === d ? 700 : 400,
                    }}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                FPS
              </label>
              <div className="flex gap-1.5">
                {FPS_OPTIONS.map(f => (
                  <button key={f} onClick={() => setFps(f)}
                    className="px-2.5 py-1.5 rounded border text-xs transition-all"
                    style={{
                      background: fps === f ? 'rgba(52,211,153,0.08)' : 'var(--bg-elevated)',
                      borderColor: fps === f ? '#34d399' : 'var(--border)',
                      color: fps === f ? '#34d399' : 'var(--text-secondary)',
                      fontFamily: 'Syne', fontWeight: fps === f ? 700 : 400,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded flex-1 justify-center text-sm font-bold transition-all"
              style={{
                background: loading || !prompt.trim() ? 'var(--bg-elevated)' : '#34d399',
                color: loading || !prompt.trim() ? 'var(--text-muted)' : '#070708',
                cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Syne',
              }}
            >
              <Send size={13} />
              {loading ? 'Queuing…' : 'Generate Video'}
            </button>
            <button onClick={() => { setPrompt(''); setImageUrl(''); setAudioUrl(''); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded border transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* ── RIGHT: Video Player ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4" style={{ background: 'var(--bg-base)' }}>

          {latestJob && latestJob.status === 'processing' && <JobProgress job={latestJob} />}

          {showOutput ? (
            <div className="slide-in flex flex-col gap-4">
              {/* Video player */}
              <div className="rounded border overflow-hidden" style={{ borderColor: latestJob?.status === 'completed' ? 'rgba(52,211,153,0.3)' : 'var(--border)', background: '#000' }}>
                {/* Video frame */}
                <div
                  className="relative flex items-center justify-center"
                  style={{ aspectRatio: isVertical ? '9/16' : ar.label === '1:1' ? '1/1' : '16/9', maxHeight: isVertical ? 420 : undefined, background: 'linear-gradient(135deg, #050505 0%, #0d1a0a 50%, #050505 100%)', cursor: 'pointer' }}
                  onClick={togglePlay}
                >
                  {/* Simulated video content: animated gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: playing
                        ? `linear-gradient(${playProgress * 360}deg, #0a0a02 0%, #1a1400 40%, #0d0a00 70%, #050500 100%)`
                        : 'linear-gradient(135deg, #080808 0%, #0f0f00 50%, #080808 100%)',
                      transition: 'background 0.5s',
                    }}
                  />

                  {/* Film grain overlay */}
                  <div className="absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)', pointerEvents: 'none' }} />

                  {/* Center control */}
                  <button
                    className="relative z-10 flex items-center justify-center rounded-full transition-all"
                    style={{ width: 56, height: 56, background: playing ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${playing ? '#34d399' : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(4px)' }}
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  >
                    {playing
                      ? <Pause size={20} style={{ color: '#34d399' }} />
                      : <Play size={20} style={{ color: 'rgba(255,255,255,0.8)', marginLeft: 3 }} />
                    }
                  </button>

                  {/* Corner badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.4)', padding: '2px 5px', borderRadius: 3 }}>{ar.label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: 'rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.4)', padding: '2px 5px', borderRadius: 3 }}>{fps}fps</span>
                  </div>

                  {latestJob?.status === 'completed' && (
                    <div className="absolute top-2 right-2">
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: 'var(--amber)', background: 'rgba(232,146,10,0.15)', padding: '2px 5px', borderRadius: 3, border: '1px solid rgba(232,146,10,0.3)' }}>stub</span>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="px-3 py-2" style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Frame ticks */}
                  <div className="flex gap-0.5 mb-1.5">
                    {Array.from({ length: TIMELINE_FRAMES }).map((_, i) => (
                      <div key={i}
                        className="flex-1 h-4 rounded-sm cursor-pointer transition-all"
                        style={{
                          background: (i / TIMELINE_FRAMES) < playProgress ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${(i / TIMELINE_FRAMES) < playProgress ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.04)'}`,
                        }}
                        onClick={() => setPlayProgress(i / TIMELINE_FRAMES)}
                      />
                    ))}
                  </div>

                  {/* Time display */}
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                      {formatTime(playProgress)} / {duration}:00
                    </span>
                    <span className="ml-auto" style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                      {motion} · {vStyle.replace(/-/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => toast('Download available with real model')}
                  className="flex items-center gap-2 px-4 py-2 rounded border text-xs transition-all"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'Syne', fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <Download size={12} />
                  Export MP4
                </button>
                <button onClick={() => toast('Share link — available with real model')}
                  className="flex items-center gap-2 px-4 py-2 rounded border text-xs transition-all"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'Syne', fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <Link size={12} />
                  Share
                </button>
              </div>

              {/* Assets summary */}
              <div className="rounded border p-3" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Composition
                </p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <VideoIcon size={10} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-secondary)' }}>Prompt: {prompt.slice(0, 60)}{prompt.length > 60 ? '…' : ''}</span>
                  </div>
                  {imageUrl && (
                    <div className="flex items-center gap-2">
                      <ImageIcon size={10} style={{ color: '#34d399' }} />
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#34d399' }}>Image: {imageUrl.slice(0, 50)}{imageUrl.length > 50 ? '…' : ''}</span>
                    </div>
                  )}
                  {audioUrl && (
                    <div className="flex items-center gap-2">
                      <Mic size={10} style={{ color: '#a78bfa' }} />
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#a78bfa' }}>Audio: {audioUrl.slice(0, 50)}{audioUrl.length > 50 ? '…' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <div style={{ fontSize: 40, opacity: 0.12 }}>🎬</div>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text-muted)' }}>
                Video player appears here
              </p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 300, lineHeight: 1.7 }}>
                Optionally pipe in an image from Image Gen and audio from Voice Gen for a full multi-modal composition.
              </p>
            </div>
          )}

          {jobs.length > 0 && (
            <div className="mt-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
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
