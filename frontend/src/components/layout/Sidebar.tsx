import { FileText, Image, Mic, Video, LayoutDashboard, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  { path: '/', icon: LayoutDashboard, label: 'Studio', key: 'dashboard' },
  { path: '/script', icon: FileText, label: 'Script', key: 'script' },
  { path: '/image', icon: Image, label: 'Image', key: 'image' },
  { path: '/voice', icon: Mic, label: 'Voice', key: 'voice' },
  { path: '/video', icon: Video, label: 'Video', key: 'video' },
];

const STEP_ORDER = ['script', 'image', 'voice', 'video'];

export function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        width: 64,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      {/* Logo mark */}
      <div className="flex items-center justify-center" style={{ height: 56, borderBottom: '1px solid var(--border)' }}>
        <div
          className="flex items-center justify-center rounded"
          style={{ width: 32, height: 32, background: 'var(--amber)', position: 'relative' }}
        >
          <span style={{ fontFamily: 'Instrument Serif', fontStyle: 'italic', color: '#070708', fontSize: 18, fontWeight: 400, lineHeight: 1 }}>
            u
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-1 py-4 flex-1">
        {NAV.map(({ path, icon: Icon, label, key }) => {
          const isActive = path === '/' ? pathname === '/' : pathname.startsWith(path);
          const stepIdx = STEP_ORDER.indexOf(key);

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={label}
              className="relative flex flex-col items-center justify-center gap-1 rounded transition-all duration-150 group"
              style={{
                width: 44,
                height: 44,
                background: isActive ? 'var(--bg-elevated)' : 'transparent',
                border: isActive ? '1px solid var(--border-bright)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              {stepIdx >= 0 && (
                <span
                  className="absolute top-1 right-1 text-center leading-none"
                  style={{ fontFamily: 'JetBrains Mono', fontSize: 7, color: isActive ? 'var(--amber)' : 'var(--text-muted)', lineHeight: 1 }}
                >
                  {stepIdx + 1}
                </span>
              )}
              <Icon size={16} style={{ color: isActive ? 'var(--amber)' : 'var(--text-secondary)' }} />
              <span style={{ fontSize: 8, color: isActive ? 'var(--amber)' : 'var(--text-muted)', fontFamily: 'JetBrains Mono', letterSpacing: '0.05em' }}>
                {label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom indicator */}
      <div className="flex items-center justify-center pb-4">
        <Activity size={12} style={{ color: 'var(--text-muted)' }} />
      </div>
    </aside>
  );
}
