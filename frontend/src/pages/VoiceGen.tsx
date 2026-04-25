import { useState } from 'react';
import { Send, RotateCcw, Mic } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { ModelSelector } from '../components/ui/ModelSelector';
import { JobProgress } from '../components/ui/JobProgress';
import { useStudioStore } from '../store/studio';
import { voiceApi } from '../api/client';
import toast from 'react-hot-toast';

const VOICES = [
  { id: 'nova', label: 'Nova', desc: 'Warm female, conversational' },
  { id: 'alloy', label: 'Alloy', desc: 'Neutral, clear, professional' },
  { id: 'echo', label: 'Echo', desc: 'Male, deep, authoritative' },
  { id: 'shimmer', label: 'Shimmer', desc: 'Bright female, energetic' },
  { id: 'onyx', label: 'Onyx', desc: 'Smooth male, storytelling' },
  { id: 'fable', label: 'Fable', desc: 'British, narrative' },
];

export function VoiceGen() {
  const { selectedModels, addOrUpdateJob } = useStudioStore();
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('nova');
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);

  const jobs = useStudioStore(s => s.jobs.filter(j => j.type === 'voice'));
  const charCount = text.length;

  const handleGenerate = async () => {
    if (!text.trim()) return toast.error('Enter text to synthesize');
    const modelId = selectedModels.voice;
    if (!modelId) return toast.error('Select a model');

    setLoading(true);
    try {
      const job = await voiceApi.generate({ text, voiceId, speed, pitch: 1.0, modelId });
      addOrUpdateJob(job);
      toast.success('Voice job queued');
    } catch {
      toast.error('Failed to start generation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Voice Generation"
        subtitle="03 — speech synthesis"
        actions={<ModelSelector step="voice" />}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6" style={{ borderRight: '1px solid var(--border)' }}>
          <div className="max-w-2xl">
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                  Script Text
                </label>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: charCount > 4000 ? 'var(--red)' : 'var(--text-muted)' }}>
                  {charCount} / 4000
                </span>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, 4000))}
                placeholder="Paste your generated script here, or type the text you want to convert to speech..."
                rows={8}
                className="w-full rounded border resize-none outline-none p-4 transition-colors"
                style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: 'JetBrains Mono', fontSize: 12, lineHeight: 1.8 }}
                onFocus={e => (e.target.style.borderColor = '#a78bfa')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Voice picker */}
            <div className="mb-5">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Voice Character
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VOICES.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setVoiceId(v.id)}
                    className="flex flex-col text-left p-3 rounded border transition-all"
                    style={{
                      background: voiceId === v.id ? 'rgba(167,139,250,0.08)' : 'var(--bg-elevated)',
                      borderColor: voiceId === v.id ? '#a78bfa' : 'var(--border)',
                    }}
                  >
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: voiceId === v.id ? '#a78bfa' : 'var(--text-primary)' }}>
                      {v.label}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {v.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div className="mb-6">
              <label className="block mb-2 text-xs uppercase tracking-widest" style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-muted)' }}>
                Speed — <span style={{ color: '#a78bfa' }}>{speed.toFixed(1)}x</span>
              </label>
              <input
                type="range" min={0.5} max={2.0} step={0.1} value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full"
                style={{ accentColor: '#a78bfa' }}
              />
              <div className="flex justify-between mt-1">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(v => (
                  <span key={v} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>{v}x</span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !text.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-all"
                style={{ background: loading || !text.trim() ? 'var(--bg-elevated)' : '#a78bfa', color: loading || !text.trim() ? 'var(--text-muted)' : '#070708', cursor: loading || !text.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Syne', fontWeight: 600 }}
              >
                <Send size={14} />
                {loading ? 'Queuing…' : 'Synthesize Voice'}
              </button>
              <button
                onClick={() => setText('')}
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
            <Mic size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>VOICE JOBS</span>
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
