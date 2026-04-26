import { Wifi, WifiOff } from 'lucide-react';
import { useStudioStore } from '../../store/studio';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  branded?: boolean;
}

export function Header({ title, subtitle, actions, branded }: Props) {
  const wsConnected = useStudioStore(s => s.wsConnected);

  return (
    <div
      className="flex items-center justify-between px-6"
      style={{ height: 56, borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}
    >
      <div className="flex items-center gap-3">
        <div>
          {branded ? (
            <h1 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: 0 }}>
              <span style={{ color: 'var(--text-primary)' }}>UG</span>
              <span style={{ color: 'var(--amber)' }}>CC</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6, marginRight: 6 }}>:</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{title}</span>
            </h1>
          ) : (
            <h1 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', lineHeight: 1 }}>
              {title}
            </h1>
          )}
          {subtitle && (
            <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {actions}
        <div className="flex items-center gap-1.5">
          {wsConnected ? (
            <Wifi size={12} style={{ color: 'var(--green)' }} />
          ) : (
            <WifiOff size={12} style={{ color: 'var(--red)' }} />
          )}
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: wsConnected ? 'var(--green)' : 'var(--red)' }}>
            {wsConnected ? 'connected' : 'offline'}
          </span>
        </div>
      </div>
    </div>
  );
}
