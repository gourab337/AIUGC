import { ChevronDown, Cpu, Key, Zap, Star } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { AIModel, WorkflowStep } from '../../types';
import { useStudioStore } from '../../store/studio';

const PROVIDER_COLORS: Record<string, string> = {
  local:          '#2ecc71',
  openai:         '#10a37f',
  anthropic:      '#c98b2e',
  google:         '#4285f4',
  replicate:      '#7c3aed',
  runway:         '#ff4f64',
  blackforestlabs:'#e87d0a',
  midjourney:     '#ffffff',
  fishaudio:      '#06b6d4',
  elevenlabs:     '#3b82f6',
  inworld:        '#a855f7',
  xai:            '#cccccc',
  mistral:        '#ff7000',
  ideogram:       '#ec4899',
  stability:      '#e87d0a',
  bytedance:      '#ff0050',
};

const QUALITY_CONFIG = {
  'highest':   { label: '★★★', color: '#e8920a' },
  'very-high': { label: '★★☆', color: '#a78bfa' },
  'high':      { label: '★☆☆', color: 'var(--text-muted)' },
};

interface Props { step: WorkflowStep; }

export function ModelSelector({ step }: Props) {
  const { models, selectedModels, setSelectedModel } = useStudioStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const stepModels = models[step] ?? [];
  const selectedId = selectedModels[step];
  const selected = stepModels.find(m => m.id === selectedId);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (stepModels.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded text-sm"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', minWidth: 220 }}>
        <div className="shimmer h-4 w-32" />
      </div>
    );
  }

  const groups = groupByProvider(stepModels);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-all duration-200 border"
        style={{
          background: 'var(--bg-elevated)',
          borderColor: open ? 'var(--amber)' : 'var(--border)',
          color: 'var(--text-primary)',
          minWidth: 224,
        }}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: selected ? PROVIDER_COLORS[selected.provider] ?? '#666' : 'var(--text-muted)' }} />
        <span className="flex-1 text-left truncate" style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'var(--text-secondary)' }}>
          {selected?.name ?? 'Select model'}
        </span>
        {selected && (
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: QUALITY_CONFIG[selected.quality].color }}>
            {QUALITY_CONFIG[selected.quality].label}
          </span>
        )}
        <ChevronDown size={11} className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded border z-50 overflow-hidden overflow-y-auto slide-in"
          style={{
            background: 'var(--bg-elevated)',
            borderColor: 'var(--border-bright)',
            width: 340,
            maxHeight: 440,
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
          }}
        >
          {groups.map(([provider, pModels]) => (
            <div key={provider}>
              {/* Provider header */}
              <div className="flex items-center gap-2 px-3 py-1.5 sticky top-0"
                style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                <div className="w-1.5 h-1.5 rounded-full"
                  style={{ background: PROVIDER_COLORS[provider] ?? '#666' }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {provider === 'local' ? 'Local Models' : provider === 'blackforestlabs' ? 'Black Forest Labs' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                </span>
                {provider === 'local'
                  ? <Cpu size={9} style={{ color: 'var(--text-muted)' }} />
                  : <Key size={9} style={{ color: 'var(--text-muted)' }} />}
              </div>

              {pModels.map(model => {
                const isSelected = model.id === selectedId;
                const qCfg = QUALITY_CONFIG[model.quality];
                return (
                  <button
                    key={model.id}
                    onClick={() => { setSelectedModel(step, model.id); setOpen(false); }}
                    className="w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors duration-100"
                    style={{
                      background: isSelected ? 'var(--bg-hover)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex flex-col flex-1 gap-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>
                          {model.name}
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: qCfg.color }}>
                          {qCfg.label}
                        </span>
                        {model.pricing && (
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ background: 'var(--border)', fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>
                            {model.pricing}
                          </span>
                        )}
                        {!model.available && (
                          <span className="px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(255,68,85,0.1)', fontFamily: 'JetBrains Mono', fontSize: 8, color: 'var(--red)' }}>
                            not connected
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {model.description}
                      </span>
                      {model.tags && (
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {model.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-1 py-0.5 rounded"
                              style={{ background: 'var(--border)', fontFamily: 'JetBrains Mono', fontSize: 8, color: 'var(--text-muted)' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {provider === 'local' ? (
                      <Cpu size={11} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                    ) : (
                      <Zap size={11} style={{ color: 'var(--text-muted)', marginTop: 2, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="px-3 py-2 text-center"
            style={{ borderTop: '1px solid var(--border)', fontFamily: 'JetBrains Mono', fontSize: 9, color: 'var(--text-muted)' }}>
            <Star size={8} className="inline mr-1" />
            Connect models in Settings — API keys &amp; local endpoints
          </div>
        </div>
      )}
    </div>
  );
}

function groupByProvider(models: AIModel[]): [string, AIModel[]][] {
  const map = new Map<string, AIModel[]>();
  models.forEach(m => {
    if (!map.has(m.provider)) map.set(m.provider, []);
    map.get(m.provider)!.push(m);
  });
  // Local first
  const entries = Array.from(map.entries());
  const local = entries.filter(([p]) => p === 'local');
  const rest = entries.filter(([p]) => p !== 'local');
  return [...local, ...rest];
}
