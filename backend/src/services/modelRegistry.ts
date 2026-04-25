import { AIModel } from '../types';

const MODELS: AIModel[] = [
  // Script models
  { id: 'llama3-local', name: 'Llama 3.1 8B (Local)', provider: 'local', type: 'script', description: 'Fast local script generation via Ollama', available: false },
  { id: 'gpt4o', name: 'GPT-4o', provider: 'openai', type: 'script', description: 'OpenAI GPT-4o — bring your own key', available: false },
  { id: 'claude-sonnet', name: 'Claude Sonnet 4.6', provider: 'anthropic', type: 'script', description: 'Anthropic Claude — bring your own key', available: false },
  // Image models
  { id: 'sdxl-local', name: 'SDXL (Local)', provider: 'local', type: 'image', description: 'Stable Diffusion XL via ComfyUI', available: false },
  { id: 'flux-local', name: 'FLUX.1 Dev (Local)', provider: 'local', type: 'image', description: 'FLUX.1 via ComfyUI', available: false },
  { id: 'stability-sd3', name: 'Stable Diffusion 3', provider: 'stability', type: 'image', description: 'Stability AI SD3 — bring your own key', available: false },
  { id: 'dall-e-3', name: 'DALL·E 3', provider: 'openai', type: 'image', description: 'OpenAI DALL·E 3 — bring your own key', available: false },
  // Voice models
  { id: 'kokoro-local', name: 'Kokoro TTS (Local)', provider: 'local', type: 'voice', description: 'High-quality local TTS', available: false },
  { id: 'elevenlabs-turbo', name: 'ElevenLabs Turbo v2', provider: 'elevenlabs', type: 'voice', description: 'ElevenLabs — bring your own key', available: false },
  { id: 'openai-tts', name: 'OpenAI TTS HD', provider: 'openai', type: 'voice', description: 'OpenAI TTS — bring your own key', available: false },
  // Video models
  { id: 'wan-local', name: 'Wan2.1 (Local)', provider: 'local', type: 'video', description: 'Wan2.1 video generation — requires GPU', available: false },
  { id: 'mochi-local', name: 'Mochi 1 (Local)', provider: 'local', type: 'video', description: 'Genmo Mochi 1 — requires GPU', available: false },
  { id: 'replicate-wan', name: 'Wan2.1 (Replicate)', provider: 'replicate', type: 'video', description: 'Wan2.1 via Replicate — bring your own key', available: false },
];

export function getModelsByType(type: AIModel['type']): AIModel[] {
  return MODELS.filter(m => m.type === type);
}

export function getModelById(id: string): AIModel | undefined {
  return MODELS.find(m => m.id === id);
}

export function getAllModels(): AIModel[] {
  return MODELS;
}
