import { useState, useEffect, useRef } from 'react';
import { Send, RotateCcw, Download, ArrowRight, Mic, Play, Pause, Import } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ModelSelector } from '../components/ui/ModelSelector';
import { JobProgress } from '../components/ui/JobProgress';
import { useStudioStore } from '../store/studio';
import { useJobsByType } from '../hooks/useJobsByType';
import { voiceApi } from '../api/client';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const VOICES = [
  { id: 'nova',    label: 'Nova',    desc: 'Warm female',     lang: '🇺🇸', accent: 'American' },
  { id: 'alloy',   label: 'Alloy',   desc: 'Neutral, clear',  lang: '🇺🇸', accent: 'American' },
  { id: 'echo',    label: 'Echo',    desc: 'Deep male',       lang: '🇬🇧', accent: 'British' },
  { id: 'shimmer', label: 'Shimmer', desc: 'Bright, energetic', lang: '🇦🇺', accent: 'Australian' },
  { id: 'onyx',    label: 'Onyx',    desc: 'Smooth, story',   lang: '🇺🇸', accent: 'American' },
  { id: 'fable',   label: 'Fable',   desc: 'British narrate', lang: '🇬🇧', accent: 'British' },
] as const;

const EMOTIONS = ['Neutral', 'Excited', 'Calm', 'Authoritative', 'Friendly', 'Dramatic'];

// Fake waveform bar heights — static to avoid re-render issues
const WAVEFORM_BARS = Array.from({ length: 48 }, (_, i) => {
  const base = Math.sin(i * 0.4) * 0.4 + 0.5;
  const noise = (Math.sin(i * 2.1 + 1) * 0.15 + Math.sin(i * 3.7 + 2) * 0.1);
  return Math.max(0.08, Math.min(1, base + noise));
});

function WaveformDisplay({ playing, progress }: { playing: boolean; progress: number }) {
  return (
    <div className="flex items-center gap-0.5 h-12">
      {WAVEFORM_BARS.map((h, i) => {
        const filled = (i / WAVEFORM_BARS.length) < progress;
        return (
          <div
            key={i}
            className="rounded-full flex-1 transition-all duration-100"
            style={{
              height: `${h * 100}%`,
              background: filled ? 'var(--amber)' : 'var(--border-bright)',
              opacity: playing && !filled ? 0.5 + Math.abs(Math.sin(i * 0.3)) * 0.5 : 1,
              transform: playing && !filled ? `scaleY(${0.8 + Math.abs(Math.sin(i * 0.2)) * 0.4})` : 'none',
              transition: playing ? 'transform 0.15s ease, background 0.1s' : 'background 0.1s',
            }}
          />
        );
      })}
    </div>
  );
}

export function VoiceGen() {
  const navigate = useNavigate();
  const { selectedModels, addOrUpdateJob, pendingVoiceText, setPendingVoiceText, setPendingVideoAudioUrl } = useStudioStore();
  const jobs = useJobsByType('voice');

  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState<string>('nova');
  const [speed, setSpeed] = useState(1.0);
  const [emotion, setEmotion] = useState('Neutral');
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedDuration = wordCount > 0 ? Math.ceil((wordCount / 150) * (1 / speed) * 60) : 0;

  const latestJob = jobs[0];
  const showOutput = latestJob && (latestJob.status === 'completed' || latestJob.status === 'processing');

  // Auto-fill from pending voice text (sent from Script Gen)
  useEffect(() => {
    if (pendingVoiceText) {
      setText(pendingVoiceText);
      setPendingVoiceText('');
    }
  }, [pendingVoiceText, setPendingVoiceText]);

  // Wire real audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => { if (audio.duration) setPlayProgress(audio.currentTime / audio.duration); };
    const onLoaded = () => setAudioDuration(Math.round(audio.duration));
    const onEnded = () => { setPlaying(false); setPlayProgress(1); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) return toast.error('Enter text to synthesize');
    const modelId = selectedModels.voice;
    if (!modelId) return toast.error('Select a model');
    setLoading(true);
    try {
      const job = await voiceApi.generate({ text, voiceId, speed, emotion, modelId });
      addOrUpdateJob(job);
      toast.success('Voice job queued');
    } catch {
      toast.error('Failed to queue job — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const audioUrl = latestJob?.output?.audioUrl as string | undefined;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    if (audio.paused) {
      if (playProgress >= 1) audio.currentTime = 0;
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  };

  const handleSendToImage = () => {
    if (!audioUrl) return toast.error('No audio generated yet');
    setPendingVideoAudioUrl(audioUrl);
    navigate('/image');
    toast.success('Voice sent to Image Gen');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const displayDuration = audioDuration || estimatedDuration;
  const currentTime = showOutput ? Math.round(playProgress * displayDuration) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Voice Generation" subtitle="03 — speech synthesis" actions={<ModelSelector step="voice" />} />

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT ─────────────────────────────── */}
        <div className="overflow-y-auto p-5 flex flex-col gap-5" style={{ width: 400, flexShrink: 0, borderRight: '1px solid var(--border)' }}>

          {/* Text input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Script Text
              </label>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: charCount > 3800 ? 'var(--red)' : 'var(--text-muted)' }}>
                  {charCount}/4000
                </span>
              </div>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 4000))}
              placeholder="Paste or type your script here…"
              rows={8}
              className="w-full rounded border resize-none outline-none p-3 text-xs transition-colors"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', lineHeight: 1.8 }}
              onFocus={e => (e.target.style.borderColor = '#a78bfa')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            {pendingVoiceText === '' && text === '' && (
              <button onClick={() => setText('')}
                className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded border text-xs transition-all"
                style={{ background: 'rgba(167,139,250,0.06)', borderColor: '#a78bfa40', color: '#a78bfa', fontFamily: 'JetBrains Mono' }}
              >
                <Import size={10} />
                Import from Script Gen
              </button>
            )}
            {wordCount > 0 && (
              <div className="flex gap-3 mt-1.5">
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>{wordCount} words</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>~{formatTime(estimatedDuration)} at {speed.toFixed(1)}×</span>
              </div>
            )}
          </div>

          {/* Voice picker */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Voice Character
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map(v => (
                <button key={v.id} onClick={() => setVoiceId(v.id)}
                  className="flex flex-col text-left p-3 rounded border transition-all"
                  style={{
                    background: voiceId === v.id ? 'rgba(167,139,250,0.1)' : 'var(--bg-elevated)',
                    borderColor: voiceId === v.id ? '#a78bfa' : 'var(--border)',
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: voiceId === v.id ? '#a78bfa' : 'var(--text-primary)' }}>
                      {v.label}
                    </span>
                    <span style={{ fontSize: 11 }}>{v.lang}</span>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {v.desc} · {v.accent}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Emotion */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Emotion / Style
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map(em => (
                <button key={em} onClick={() => setEmotion(em)}
                  className="px-2.5 py-1 rounded border text-xs transition-all"
                  style={{
                    background: emotion === em ? 'rgba(167,139,250,0.1)' : 'var(--bg-elevated)',
                    borderColor: emotion === em ? '#a78bfa' : 'var(--border)',
                    color: emotion === em ? '#a78bfa' : 'var(--text-secondary)',
                    fontFamily: 'JetBrains Mono',
                  }}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Speed — <span style={{ color: '#a78bfa' }}>{speed.toFixed(1)}×</span>
            </label>
            <input type="range" min={0.5} max={2.0} step={0.1} value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-full" style={{ accentColor: '#a78bfa' }} />
            <div className="flex justify-between mt-1">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(v => (
                <span key={v} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: Math.abs(v - speed) < 0.05 ? '#a78bfa' : 'var(--text-muted)' }}>
                  {v}×
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleGenerate} disabled={loading || !text.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded flex-1 justify-center text-sm font-bold transition-all"
              style={{
                background: loading || !text.trim() ? 'var(--bg-elevated)' : '#a78bfa',
                color: loading || !text.trim() ? 'var(--text-muted)' : '#070708',
                cursor: loading || !text.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Syne',
              }}
            >
              <Send size={13} />
              {loading ? 'Queuing…' : 'Synthesize'}
            </button>
            <button onClick={() => setText('')}
              className="flex items-center gap-2 px-3 py-2.5 rounded border transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* ── RIGHT: Audio Player ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col" style={{ background: 'var(--bg-base)', gap: 16 }}>

          {latestJob && latestJob.status === 'processing' && <JobProgress job={latestJob} />}

          {showOutput ? (
            <div className="slide-in flex flex-col gap-4">
              {/* Player card */}
              <div className="rounded border p-5" style={{ background: 'var(--bg-surface)', borderColor: latestJob?.status === 'completed' ? 'rgba(167,139,250,0.25)' : 'var(--border)' }}>

                {/* Voice badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)' }}>
                    <Mic size={14} style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                      {VOICES.find(v => v.id === voiceId)?.label ?? voiceId}
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>
                        {VOICES.find(v => v.id === voiceId)?.accent}
                      </span>
                    </p>
                    <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>
                      {emotion} · {speed.toFixed(1)}× speed
                    </p>
                  </div>
                  {latestJob?.status === 'completed' && Boolean(latestJob?.output?.stub) && (
                    <span className="ml-auto px-2 py-0.5 rounded" style={{ background: 'rgba(232,146,10,0.1)', fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--amber)', border: '1px solid rgba(232,146,10,0.2)' }}>
                      stub output
                    </span>
                  )}
                </div>

                {/* Hidden real audio element */}
                {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

                {/* Waveform */}
                <div className="mb-3 px-1">
                  <WaveformDisplay playing={playing} progress={playProgress} />
                </div>

                {/* Scrubber */}
                <div className="flex items-center gap-3 mb-3">
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', width: 32, textAlign: 'right' }}>
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 h-0.5 rounded-full relative cursor-pointer"
                    style={{ background: 'var(--border)' }}
                    onClick={e => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const frac = (e.clientX - rect.left) / rect.width;
                      setPlayProgress(frac);
                      const audio = audioRef.current;
                      if (audio && audio.duration) audio.currentTime = frac * audio.duration;
                    }}
                  >
                    <div className="h-full rounded-full" style={{ width: `${playProgress * 100}%`, background: '#a78bfa' }} />
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', width: 32 }}>
                    {formatTime(displayDuration || 0)}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center">
                  <button onClick={togglePlay}
                    className="flex items-center justify-center w-10 h-10 rounded-full transition-all"
                    style={{
                      background: playing ? '#a78bfa' : 'rgba(167,139,250,0.15)',
                      border: '1px solid rgba(167,139,250,0.4)',
                    }}
                    onMouseEnter={e => { if (!playing) e.currentTarget.style.background = 'rgba(167,139,250,0.25)'; }}
                    onMouseLeave={e => { if (!playing) e.currentTarget.style.background = 'rgba(167,139,250,0.15)'; }}
                  >
                    {playing
                      ? <Pause size={16} style={{ color: '#070708' }} />
                      : <Play size={16} style={{ color: '#a78bfa', marginLeft: 2 }} />
                    }
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={audioUrl}
                  download="voice.wav"
                  className="flex items-center gap-2 px-4 py-2 rounded border text-xs transition-all"
                  style={{ background: 'var(--bg-elevated)', borderColor: audioUrl ? 'var(--border)' : 'transparent', color: audioUrl ? 'var(--text-secondary)' : 'var(--text-muted)', fontFamily: 'Syne', fontWeight: 600, pointerEvents: audioUrl ? 'auto' : 'none', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <Download size={12} />
                  Download WAV
                </a>
                <button onClick={handleSendToImage}
                  className="flex items-center gap-2 px-4 py-2 rounded border text-xs transition-all"
                  style={{ background: 'rgba(52,211,153,0.08)', borderColor: '#34d399', color: '#34d399', fontFamily: 'Syne', fontWeight: 600 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.15)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.08)')}
                >
                  <ArrowRight size={12} />
                  Send to Image Gen
                </button>
              </div>

              {/* Transcript preview */}
              {text && (
                <div className="rounded border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Transcript
                  </p>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8, maxHeight: 120, overflow: 'hidden', maskImage: 'linear-gradient(to bottom, black 70%, transparent)' }}>
                    {text}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <div style={{ fontSize: 40, opacity: 0.12 }}>🎙</div>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text-muted)' }}>
                Audio player appears here
              </p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 280, lineHeight: 1.7 }}>
                Paste a script, choose a voice, and hit Synthesize.
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
