import { useEffect, useRef } from 'react';
import { useStudioStore } from '../store/studio';
import { jobsApi } from '../api/client';
import type { WSMessage } from '../types';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;

    const { setWsConnected, addOrUpdateJob, setJobs } = useStudioStore.getState();

    // Hydrate store with existing jobs from backend on mount
    jobsApi.getAll().then(jobs => { if (alive) setJobs(jobs); }).catch(() => {});

    const connect = () => {
      if (!alive) return;

      // Use Vite proxy path — works in dev and prod without hardcoding port
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (alive) useStudioStore.getState().setWsConnected(true);
      };

      ws.onclose = () => {
        if (!alive) return;
        useStudioStore.getState().setWsConnected(false);
        timerRef.current = setTimeout(connect, 3000);
      };

      ws.onmessage = (evt) => {
        if (!alive) return;
        try {
          const msg: WSMessage = JSON.parse(evt.data);
          if (msg.job) useStudioStore.getState().addOrUpdateJob(msg.job);
        } catch { /* ignore malformed frames */ }
      };
    };

    connect();

    return () => {
      alive = false;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      const ws = wsRef.current;
      wsRef.current = null;
      // Remove onclose before closing so it doesn't schedule a reconnect
      if (ws) { ws.onclose = null; ws.close(); }
    };
  }, []);
}
