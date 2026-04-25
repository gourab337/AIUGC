import { useEffect, useRef } from 'react';
import { useStudioStore } from '../store/studio';
import type { WSMessage } from '../types';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { setWsConnected, addOrUpdateJob } = useStudioStore();

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(`ws://localhost:3001/ws`);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connect, 3000);
      };
      ws.onmessage = (evt) => {
        try {
          const msg: WSMessage = JSON.parse(evt.data);
          if (msg.job) addOrUpdateJob(msg.job);
        } catch {}
      };
    };

    connect();
    return () => { wsRef.current?.close(); };
  }, []);
}
