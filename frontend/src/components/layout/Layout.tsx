import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Terminal } from '../terminal/Terminal';
import { Toaster } from 'react-hot-toast';

export function Layout() {
  const [terminalOpen, setTerminalOpen] = useState(false);

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden flex flex-col">
          <Outlet />
        </main>
        <Terminal isOpen={terminalOpen} onToggle={() => setTerminalOpen(o => !o)} />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-bright)',
            fontFamily: 'JetBrains Mono',
            fontSize: 12,
          },
        }}
      />
    </div>
  );
}
