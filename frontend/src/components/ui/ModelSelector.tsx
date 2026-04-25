import { ChevronDown, Cpu, Key, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { AIModel, WorkflowStep } from '../../types';
import { useStudioStore } from '../../store/studio';
import clsx from 'clsx';

const PROVIDER_COLORS: Record<string, string> = {
  local: '#2ecc71',
  openai: '#10a37f',
  anthropic: '#c98b2e',
  replicate: '#7c3aed',
  stability: '#e87d0a',
  elevenlabs: '#3b82f6',
};

interface Props {
  step: WorkflowStep;
}

export function ModelSelector({ step }: Props) {
  const { models, selectedModels, setSelectedModel } = useStudioStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const stepModels = models[step] || [];
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
      <div className="flex items-center gap-2 px-3 py-2 rounded text-sm" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
        <div className="shimmer h-4 w-32" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded text-sm transition-all duration-200 border',
          open ? 'border-[var(--amber)]' : 'border-[var(--border)]'
        )}
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', minWidth: 220 }}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: selected ? PROVIDER_COLORS[selected.provider] : 'var(--text-muted)' }} />
        <span className="flex-1 text-left truncate font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {selected?.name || 'Select model'}
        </span>
        <ChevronDown size={12} className={clsx('flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded border z-50 overflow-hidden slide-in"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-bright)', width: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
        >
          {groupByProvider(stepModels).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="px-3 py-1.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: PROVIDER_COLORS[provider] }} />
                <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                  {provider === 'local' ? 'Local' : provider.charAt(0).toUpperCase() + provider.slice(1)}
                </span>
                {provider === 'local' && <Cpu size={10} style={{ color: 'var(--text-muted)' }} />}
                {provider !== 'local' && <Key size={10} style={{ color: 'var(--text-muted)' }} />}
              </div>
              {providerModels.map(model => (
                <button
                  key={model.id}
                  onClick={() => { setSelectedModel(step, model.id); setOpen(false); }}
                  className="w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors duration-150"
                  style={{
                    background: model.id === selectedId ? 'var(--bg-hover)' : 'transparent',
                    borderBottom: '1px solid var(--border)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = model.id === selectedId ? 'var(--bg-hover)' : 'transparent')}
                >
                  <div className="flex flex-col flex-1 gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Syne' }}>{model.name}</span>
                      {!model.available && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,68,85,0.12)', color: 'var(--red)', fontFamily: 'JetBrains Mono' }}>
                          not connected
                        </span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{model.description}</span>
                  </div>
                  {!model.available && <AlertCircle size={12} style={{ color: 'var(--text-muted)', marginTop: 3, flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          ))}
          <div className="px-3 py-2 text-xs text-center" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', borderTop: '1px solid var(--border)' }}>
            Models connect in next step — API keys & local setup
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
  return Array.from(map.entries());
}
