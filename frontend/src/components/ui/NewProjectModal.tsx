import { useState } from 'react';
import { X } from 'lucide-react';
import type { UGCNiche } from '../../types';
import { UGC_TEMPLATES, NICHE_ORDER } from '../../data/ugcTemplates';

interface Props {
  onClose: () => void;
  onCreate: (data: { name: string; client: string; niche?: UGCNiche; description?: string }) => void;
}

export function NewProjectModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [client, setClient] = useState('loafmarkets.com');
  const [selectedNiche, setSelectedNiche] = useState<UGCNiche | null>(null);
  const [description, setDescription] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      client: client.trim() || 'loafmarkets.com',
      niche: selectedNiche ?? undefined,
      description: description.trim() || undefined,
    });
  }

  function selectNiche(niche: UGCNiche) {
    setSelectedNiche(prev => (prev === niche ? null : niche));
    const t = UGC_TEMPLATES[niche];
    if (!name) setDescription(t.description);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(7,7,8,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col"
        style={{
          width: 560,
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-bright)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <div style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              New Project
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 2 }}>
              Select a niche template or start blank
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }} className="hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">
          {/* Niche templates */}
          <div>
            <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 10 }}>
              UGC NICHE TEMPLATE
            </div>
            <div className="grid grid-cols-2 gap-3">
              {NICHE_ORDER.map(niche => {
                const t = UGC_TEMPLATES[niche];
                const active = selectedNiche === niche;
                return (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => selectNiche(niche)}
                    className="text-left rounded-lg p-3 transition-all duration-150"
                    style={{
                      background: active ? 'var(--bg-elevated)' : 'var(--bg-base)',
                      border: `1px solid ${active ? t.colorAccent : 'var(--border)'}`,
                      outline: 'none',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.colorAccent, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Syne', fontSize: 12, fontWeight: 700, color: active ? t.colorAccent : 'var(--text-primary)' }}>
                        {t.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', lineHeight: 1.4 }}>
                      {t.tagline}
                    </div>
                    {t.inspiration.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.inspiration.map(i => (
                          <span key={i} style={{ fontSize: 9, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px' }}>
                            @{i}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form fields */}
          <form id="new-project-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                PROJECT NAME *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={selectedNiche ? `${UGC_TEMPLATES[selectedNiche].label} Experiment 01` : 'Experiment name…'}
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                CLIENT
              </label>
              <input
                value={client}
                onChange={e => setClient(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                DESCRIPTION
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Brief description of the experiment…"
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 12,
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.5,
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--amber)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{ fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-project-form"
            style={{
              fontFamily: 'Syne',
              fontSize: 13,
              fontWeight: 700,
              color: '#070708',
              background: 'var(--amber)',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}
