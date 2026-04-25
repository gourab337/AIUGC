import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ScriptGen } from './pages/ScriptGen';
import { ImageGen } from './pages/ImageGen';
import { VoiceGen } from './pages/VoiceGen';
import { VideoGen } from './pages/VideoGen';
import { useWebSocket } from './hooks/useWebSocket';
import { useModels } from './hooks/useModels';
import { jobsApi } from './api/client';
import { useStudioStore } from './store/studio';

function AppInner() {
  useWebSocket();
  useModels();
  const setJobs = useStudioStore(s => s.setJobs);

  useEffect(() => {
    jobsApi.getAll().then(setJobs).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="script" element={<ScriptGen />} />
          <Route path="image" element={<ImageGen />} />
          <Route path="voice" element={<VoiceGen />} />
          <Route path="video" element={<VideoGen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AppInner />;
}
