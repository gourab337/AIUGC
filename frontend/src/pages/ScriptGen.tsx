import { useState } from 'react';
import {
  Send, RotateCcw, Copy, Check, ArrowRight, Sparkles, FileText,
  Clock, Users, Zap, BookOpen
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ModelSelector } from '../components/ui/ModelSelector';
import { JobProgress } from '../components/ui/JobProgress';
import { useStudioStore } from '../store/studio';
import { useJobsByType } from '../hooks/useJobsByType';
import { scriptApi } from '../api/client';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const TONES = [
  { id: 'energetic', label: 'Energetic', icon: Zap },
  { id: 'cinematic', label: 'Cinematic', icon: BookOpen },
  { id: 'casual', label: 'Casual', icon: Users },
  { id: 'professional', label: 'Professional', icon: FileText },
] as const;

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', ratio: '9:16' },
  { id: 'instagram', label: 'Instagram', ratio: '1:1' },
  { id: 'youtube', label: 'YouTube', ratio: '16:9' },
  { id: 'twitter', label: 'Twitter / X', ratio: '16:9' },
] as const;

const HOOK_STYLES = ['Question', 'Shocking stat', 'Story / scene', 'Bold claim', 'Challenge'];
const CTA_STYLES = ['Shop now', 'Link in bio', 'Comment below', 'Save this', 'Follow for more'];

const QUICK_PROMPTS = [
  'Skincare brand targeting gen-Z, natural ingredients, glow-up transformation',
  'Fitness supplement launch, before/after results, 30-day challenge',
  'Luxury fashion drop, limited edition, celebrity collaboration',
  'Tech gadget unboxing, feature showcase, everyday productivity boost',
];

const STUB_SCRIPT = {
  hook: "You've been doing it wrong your entire life.",
  body: [
    "Most people spend hundreds on products that just sit on the surface and never actually work. That changes today.",
    "Introducing the formula that beauty editors have been trying to keep secret — bioactive peptides that penetrate 3 layers deep, rebuilding from within.",
    "Clinical trials showed a 94% improvement in skin texture within just 14 days. Not months. Days.",
  ],
  cta: "Try it risk-free for 30 days or your money back. Tap the link in bio right now — this offer expires at midnight.",
};

function wordCount(s: typeof STUB_SCRIPT) {
  const all = [s.hook, ...s.body, s.cta].join(' ');
  return all.split(/\s+/).length;
}

function readingTime(wc: number, wpm = 150) {
  return Math.ceil(wc / wpm);
}

export function ScriptGen() {
  const navigate = useNavigate();
  const { selectedModels, addOrUpdateJob, setPendingVoiceText } = useStudioStore();
  const jobs = useJobsByType('script');

  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<'energetic' | 'cinematic' | 'casual' | 'professional'>('energetic');
  const [platform, setPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'twitter'>('tiktok');
  const [duration, setDuration] = useState(30);
  const [audience, setAudience] = useState('');
  const [hookStyle, setHookStyle] = useState('Question');
  const [ctaStyle, setCtaStyle] = useState('Link in bio');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const latestJob = jobs[0];
  const showOutput = latestJob && (latestJob.status === 'completed' || latestJob.status === 'processing');
  const wc = wordCount(STUB_SCRIPT);
  const rt = readingTime(wc);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('Enter a campaign brief first');
    const modelId = selectedModels.script;
    if (!modelId) return toast.error('Select a model');

    setLoading(true);
    try {
      const job = await scriptApi.generate({ prompt, tone, platform, duration, audience, hookStyle, ctaStyle, modelId });
      addOrUpdateJob(job);
      toast.success('Script job queued');
    } catch {
      toast.error('Failed to queue job — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = [
      `HOOK:\n${STUB_SCRIPT.hook}`,
      `\nBODY:\n${STUB_SCRIPT.body.join('\n\n')}`,
      `\nCTA:\n${STUB_SCRIPT.cta}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleSendToVoice = () => {
    const text = [STUB_SCRIPT.hook, ...STUB_SCRIPT.body, STUB_SCRIPT.cta].join('\n\n');
    setPendingVoiceText(text);
    navigate('/voice');
    toast.success('Script sent to Voice Gen');
  };

  // Active job from WS updates
  const activeJob = jobs[0];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Script Generation"
        subtitle="01 — narrative & copy"
        actions={<ModelSelector step="script" />}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Input Form ────────────────────────────── */}
        <div className="overflow-y-auto p-5 flex flex-col gap-5" style={{ width: 420, flexShrink: 0, borderRight: '1px solid var(--border)' }}>

          {/* Quick prompts */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Quick Start
            </label>
            <div className="flex flex-col gap-1.5">
              {QUICK_PROMPTS.map((qp, i) => (
                <button key={i} onClick={() => setPrompt(qp)}
                  className="text-left px-3 py-2 rounded border text-xs transition-all"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', lineHeight: 1.5 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Sparkles size={9} className="inline mr-1.5" style={{ color: 'var(--amber)' }} />
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign brief */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Campaign Brief
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe the product, key message, and what makes it special..."
              rows={5}
              className="w-full rounded border resize-none outline-none p-3 text-xs transition-colors"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', lineHeight: 1.7 }}
              onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Target Audience <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input type="text" value={audience} onChange={e => setAudience(e.target.value)}
              placeholder="e.g. Gen-Z women aged 18–24, beauty enthusiasts"
              className="w-full rounded border outline-none px-3 py-2 text-xs transition-colors"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}
              onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* Tone */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Tone
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTone(id)}
                  className="flex items-center gap-2 px-3 py-2 rounded border text-xs transition-all"
                  style={{
                    background: tone === id ? 'rgba(232,146,10,0.1)' : 'var(--bg-elevated)',
                    borderColor: tone === id ? 'var(--amber)' : 'var(--border)',
                    color: tone === id ? 'var(--amber)' : 'var(--text-secondary)',
                    fontFamily: 'Syne', fontWeight: tone === id ? 700 : 400,
                  }}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Platform
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map(({ id, label, ratio }) => (
                <button key={id} onClick={() => setPlatform(id)}
                  className="flex items-center justify-between px-3 py-2 rounded border text-xs transition-all"
                  style={{
                    background: platform === id ? 'rgba(0,200,224,0.08)' : 'var(--bg-elevated)',
                    borderColor: platform === id ? 'var(--cyan)' : 'var(--border)',
                    fontFamily: 'Syne', fontWeight: platform === id ? 700 : 400,
                    color: platform === id ? 'var(--cyan)' : 'var(--text-secondary)',
                  }}
                >
                  <span>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>{ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hook style */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Hook Style
            </label>
            <div className="flex flex-wrap gap-2">
              {HOOK_STYLES.map(h => (
                <button key={h} onClick={() => setHookStyle(h)}
                  className="px-2.5 py-1 rounded border text-xs transition-all"
                  style={{
                    background: hookStyle === h ? 'rgba(167,139,250,0.1)' : 'var(--bg-elevated)',
                    borderColor: hookStyle === h ? '#a78bfa' : 'var(--border)',
                    color: hookStyle === h ? '#a78bfa' : 'var(--text-secondary)',
                    fontFamily: 'JetBrains Mono',
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* CTA style */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Call to Action
            </label>
            <div className="flex flex-wrap gap-2">
              {CTA_STYLES.map(c => (
                <button key={c} onClick={() => setCtaStyle(c)}
                  className="px-2.5 py-1 rounded border text-xs transition-all"
                  style={{
                    background: ctaStyle === c ? 'rgba(52,211,153,0.08)' : 'var(--bg-elevated)',
                    borderColor: ctaStyle === c ? '#34d399' : 'var(--border)',
                    color: ctaStyle === c ? '#34d399' : 'var(--text-secondary)',
                    fontFamily: 'JetBrains Mono',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
              Duration — <span style={{ color: 'var(--amber)' }}>{duration}s</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>≈ {Math.round(duration * 2.5)} words</span>
            </label>
            <input type="range" min={15} max={180} step={15} value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full" style={{ accentColor: 'var(--amber)' }} />
            <div className="flex justify-between mt-1">
              {[15, 30, 60, 90, 120, 180].map(v => (
                <span key={v} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: v === duration ? 'var(--amber)' : 'var(--text-muted)' }}>{v}s</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2.5 rounded flex-1 justify-center transition-all text-sm font-bold"
              style={{
                background: loading || !prompt.trim() ? 'var(--bg-elevated)' : 'var(--amber)',
                color: loading || !prompt.trim() ? 'var(--text-muted)' : '#070708',
                cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'Syne',
              }}
            >
              <Send size={13} />
              {loading ? 'Queuing…' : 'Generate'}
            </button>
            <button onClick={() => { setPrompt(''); setAudience(''); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded border transition-all"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', borderColor: 'var(--border)', fontFamily: 'Syne', fontSize: 13 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* ── RIGHT: Output + History ──────────────────────── */}
        <div className="flex-1 overflow-y-auto flex flex-col" style={{ background: 'var(--bg-base)' }}>

          {/* Active progress bar */}
          {activeJob && activeJob.status === 'processing' && (
            <div className="px-5 pt-4">
              <JobProgress job={activeJob} />
            </div>
          )}

          {/* Script output */}
          {showOutput ? (
            <div className="flex-1 p-5 slide-in">
              {/* Metadata bar */}
              <div className="flex items-center gap-4 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5">
                  <FileText size={11} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)' }}>{wc} words</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)' }}>~{rt}s read aloud</span>
                </div>
                {latestJob?.status === 'completed' && Boolean(latestJob?.output?.stub) && (
                  <span className="ml-auto px-2 py-0.5 rounded" style={{ background: 'rgba(232,146,10,0.1)', fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--amber)', border: '1px solid rgba(232,146,10,0.2)' }}>
                    stub — connect a model for real output
                  </span>
                )}
              </div>

              {/* Formatted script */}
              <div className="flex flex-col gap-5">
                {/* Hook */}
                <div className="rounded border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'rgba(232,146,10,0.3)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 rounded-full" style={{ background: 'var(--amber)' }} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--amber)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Hook · 0–3s</span>
                  </div>
                  <p style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', fontSize: 18, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    "{STUB_SCRIPT.hook}"
                  </p>
                </div>

                {/* Body */}
                <div className="rounded border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 rounded-full" style={{ background: 'var(--cyan)' }} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--cyan)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Body · 3–{duration - 5}s</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {STUB_SCRIPT.body.map((para, i) => (
                      <p key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        {para}
                      </p>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div className="rounded border p-4" style={{ background: 'var(--bg-surface)', borderColor: 'rgba(52,211,153,0.3)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-4 rounded-full" style={{ background: '#34d399' }} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#34d399', letterSpacing: '0.15em', textTransform: 'uppercase' }}>CTA · {duration - 5}–{duration}s</span>
                  </div>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {STUB_SCRIPT.cta}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 rounded border text-xs transition-all"
                    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-secondary)', fontFamily: 'Syne', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    {copied ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy script'}
                  </button>
                  <button onClick={handleSendToVoice}
                    className="flex items-center gap-2 px-4 py-2 rounded border text-xs transition-all"
                    style={{ background: 'rgba(167,139,250,0.08)', borderColor: '#a78bfa', color: '#a78bfa', fontFamily: 'Syne', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.08)')}
                  >
                    <ArrowRight size={12} />
                    Send to Voice Gen
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
              <div style={{ fontSize: 40, opacity: 0.12 }}>✍️</div>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text-muted)' }}>
                Output will appear here
              </p>
              <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 280, lineHeight: 1.7 }}>
                Fill in your brief, select tone &amp; platform, then click Generate.
              </p>
            </div>
          )}

          {/* History */}
          {jobs.length > 0 && (
            <div className="p-5 border-t" style={{ borderColor: 'var(--border)' }}>
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
