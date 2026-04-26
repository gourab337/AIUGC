import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { ChevronDown, ChevronUp, Terminal as TerminalIcon, Plus, Trash2 } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';

const TERMINAL_WS = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/terminal`;
const MIN_HEIGHT = 120;
const DEFAULT_HEIGHT = 260;
const MAX_HEIGHT = 600;

interface Props {
  isOpen: boolean;
  onToggle: () => void;
}

export function Terminal({ isOpen, onToggle }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [connected, setConnected] = useState(false);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  // Init xterm once the panel is open and the DOM node is available
  const initTerm = useCallback(() => {
    if (!containerRef.current || xtermRef.current) return;

    const term = new XTerm({
      theme: {
        background: '#070708',
        foreground: '#f0ede8',
        cursor: '#e8920a',
        cursorAccent: '#070708',
        black: '#070708',
        brightBlack: '#4a4a55',
        white: '#f0ede8',
        brightWhite: '#ffffff',
        cyan: '#00c8e0',
        brightCyan: '#00e5ff',
        yellow: '#e8920a',
        brightYellow: '#ffa726',
        green: '#4ade80',
        brightGreen: '#69f0ae',
        red: '#f87171',
        brightRed: '#ff5252',
        blue: '#64b5f6',
        brightBlue: '#82b1ff',
        magenta: '#ce93d8',
        brightMagenta: '#ea80fc',
        selectionBackground: '#e8920a33',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 12,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 5000,
      allowTransparency: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(containerRef.current);
    fit.fit();

    xtermRef.current = term;
    fitRef.current = fit;

    // Connect WebSocket PTY
    const ws = new WebSocket(TERMINAL_WS);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Send initial resize
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (e) => {
      const data = typeof e.data === 'string' ? e.data : new TextDecoder().decode(e.data);
      term.write(data);
    };

    ws.onclose = () => {
      setConnected(false);
      term.write('\r\n\x1b[33m[session closed — click + to reconnect]\x1b[0m\r\n');
    };

    ws.onerror = () => {
      term.write('\r\n\x1b[31m[connection error — is the backend running on port 3001?]\x1b[0m\r\n');
    };

    term.onData(data => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }));
      }
    });

    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });
  }, []);

  // Destroy and disconnect
  const destroyTerm = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    xtermRef.current?.dispose();
    xtermRef.current = null;
    fitRef.current = null;
    setConnected(false);
  }, []);

  // New session button
  const reconnect = useCallback(() => {
    destroyTerm();
    setTimeout(initTerm, 50);
  }, [destroyTerm, initTerm]);

  useEffect(() => {
    if (isOpen) {
      // Give DOM time to render
      const t = setTimeout(initTerm, 30);
      return () => clearTimeout(t);
    } else {
      destroyTerm();
    }
  }, [isOpen, initTerm, destroyTerm]);

  // Re-fit when height changes
  useEffect(() => {
    if (!fitRef.current || !xtermRef.current) return;
    const t = setTimeout(() => {
      fitRef.current?.fit();
    }, 30);
    return () => clearTimeout(t);
  }, [height]);

  // Drag-to-resize handle
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startH: height };

    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return;
      const delta = dragRef.current.startY - ev.clientY;
      setHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragRef.current.startH + delta)));
    }

    function onUp() {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [height]);

  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#070708', borderTop: '1px solid #222226' }}>
      {/* Drag handle — only visible when open */}
      {isOpen && (
        <div
          onMouseDown={onDragStart}
          style={{
            height: 4,
            cursor: 'ns-resize',
            background: 'transparent',
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#e8920a44')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title="Drag to resize"
        />
      )}

      {/* Tab bar */}
      <div
        className="flex items-center justify-between px-3"
        style={{ height: 32, borderBottom: isOpen ? '1px solid #222226' : 'none', cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <TerminalIcon size={12} style={{ color: '#e8920a' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4a4a55', letterSpacing: '0.08em' }}>
            TERMINAL
          </span>
          {isOpen && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#4ade80' : '#4a4a55', transition: 'background 300ms' }} title={connected ? 'Connected' : 'Disconnected'} />
          )}
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {isOpen && (
            <>
              <button
                onClick={reconnect}
                title="New session"
                style={{ background: 'none', border: 'none', color: '#4a4a55', cursor: 'pointer', padding: '4px 5px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4a4a55')}
              >
                <Plus size={11} />
              </button>
              <button
                onClick={() => { destroyTerm(); onToggle(); }}
                title="Close terminal"
                style={{ background: 'none', border: 'none', color: '#4a4a55', cursor: 'pointer', padding: '4px 5px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4a4a55')}
              >
                <Trash2 size={11} />
              </button>
            </>
          )}
          <div style={{ padding: '4px 5px', color: '#4a4a55', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={onToggle}>
            {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </div>
        </div>
      </div>

      {/* xterm container */}
      {isOpen && (
        <div
          ref={containerRef}
          style={{
            height,
            background: '#070708',
            padding: '6px 4px 4px 4px',
            overflow: 'hidden',
          }}
        />
      )}
    </div>
  );
}
