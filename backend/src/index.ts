import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { wsClients } from './wsClients';
import modelsRouter from './routes/models';
import scriptRouter from './routes/script';
import imageRouter from './routes/image';
import voiceRouter from './routes/voice';
import videoRouter from './routes/video';
import jobsRouter from './routes/jobs';

const app = express();
const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });
wss.on('connection', (ws: WebSocket) => {
  wsClients.add(ws);
  ws.send(JSON.stringify({ type: 'connected', message: 'AI UGC Studio connected' }));
  ws.on('close', () => wsClients.delete(ws));
});

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

app.use('/api/models', modelsRouter);
app.use('/api/script', scriptRouter);
app.use('/api/image', imageRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/video', videoRouter);
app.use('/api/jobs', jobsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  AI UGC Studio API running on http://localhost:${PORT}`);
  console.log(`  WebSocket available at ws://localhost:${PORT}/ws\n`);
});
