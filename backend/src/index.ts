import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import * as pty from 'node-pty';
import path from 'path';
import fs from 'fs';
import { wsClients } from './wsClients';
import modelsRouter from './routes/models';
import scriptRouter from './routes/script';
import imageRouter from './routes/image';
import voiceRouter from './routes/voice';
import videoRouter from './routes/video';
import jobsRouter from './routes/jobs';
import projectsRouter from './routes/projects';

const app = express();
const server = createServer(app);

// noServer mode — manual upgrade routing prevents the second server from sending 400 on the same socket
const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });
const termWss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

server.on('upgrade', (req, socket, head) => {
  const url = req.url ?? '';
  if (url === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else if (url.startsWith('/ws/terminal')) {
    termWss.handleUpgrade(req, socket, head, (ws) => termWss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws: WebSocket) => {
  wsClients.add(ws);
  ws.send(JSON.stringify({ type: 'connected', message: 'AI UGC Studio connected' }));
  ws.on('close', () => wsClients.delete(ws));
});

termWss.on('connection', (ws: WebSocket) => {
  const shell = process.env.SHELL || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash');
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 120,
    rows: 30,
    cwd: process.env.HOME || process.cwd(),
    env: process.env as Record<string, string>,
  });

  ptyProcess.onData(data => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });

  ptyProcess.onExit(() => {
    if (ws.readyState === WebSocket.OPEN) ws.close();
  });

  ws.on('message', (msg: Buffer | string) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === 'resize') {
        ptyProcess.resize(parsed.cols, parsed.rows);
      } else if (parsed.type === 'input') {
        ptyProcess.write(parsed.data);
      }
    } catch {
      ptyProcess.write(msg.toString());
    }
  });

  ws.on('close', () => {
    try { ptyProcess.kill(); } catch { /* already dead */ }
  });
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));
const generatedDir = process.env.GENERATED_DIR ?? path.join(process.cwd(), 'public', 'generated');
fs.mkdirSync(generatedDir, { recursive: true });
app.use('/generated', express.static('/tmp/ugcc_generated'));
app.use('/generated', express.static(generatedDir));

app.use('/api/models', modelsRouter);
app.use('/api/script', scriptRouter);
app.use('/api/image', imageRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/video', videoRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/projects', projectsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  AI UGC Studio API running on http://localhost:${PORT}`);
  console.log(`  WebSocket available at ws://localhost:${PORT}/ws\n`);
});
