import type { UGCNiche } from '../types';

export interface UGCTemplate {
  niche: UGCNiche;
  label: string;
  tagline: string;
  inspiration: string[];
  scriptDefaults: {
    tone: 'professional' | 'casual' | 'energetic' | 'cinematic';
    platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
    hookStyle: string;
    ctaStyle: string;
    duration: number;
    audience: string;
  };
  imageDefaults: {
    style: string;
    aspectRatio: string;
  };
  voiceDefaults: {
    emotion: string;
  };
  videoDefaults: {
    cameraMotion: string;
    style: string;
    duration: number;
  };
  colorAccent: string;
  description: string;
}

export const UGC_TEMPLATES: Record<UGCNiche, UGCTemplate> = {
  'luxury-aesthetic': {
    niche: 'luxury-aesthetic',
    label: 'Luxury Aesthetic',
    tagline: 'Old money. Quiet confidence.',
    inspiration: ['22perception', 'highsocity', 'heritageclass'],
    scriptDefaults: {
      tone: 'cinematic',
      platform: 'instagram',
      hookStyle: 'Bold claim',
      ctaStyle: 'Follow for more',
      duration: 30,
      audience: 'Affluent professionals 28–45, heritage fashion & watch enthusiasts',
    },
    imageDefaults: {
      style: 'editorial',
      aspectRatio: '4:5',
    },
    voiceDefaults: {
      emotion: 'calm',
    },
    videoDefaults: {
      cameraMotion: 'slow-pan',
      style: 'cinematic',
      duration: 30,
    },
    colorAccent: '#c9a96e',
    description: 'Cool-toned editorial grade, slow pacing, soft CTAs. Heritage watches, cars, quiet wealth.',
  },

  'crypto-hype': {
    niche: 'crypto-hype',
    label: 'Crypto / Betting Hype',
    tagline: 'Meme energy. Brand exposure.',
    inspiration: ['rainbet', 'stake'],
    scriptDefaults: {
      tone: 'energetic',
      platform: 'tiktok',
      hookStyle: 'Shocking stat',
      ctaStyle: 'Comment below',
      duration: 20,
      audience: 'Crypto-native 18–32, meme culture, high risk tolerance',
    },
    imageDefaults: {
      style: 'neon-surreal',
      aspectRatio: '9:16',
    },
    voiceDefaults: {
      emotion: 'excited',
    },
    videoDefaults: {
      cameraMotion: 'handheld',
      style: 'fast-cut',
      duration: 20,
    },
    colorAccent: '#00ff87',
    description: 'Meme-heavy, absurdist, viral. No direct pitch — brand exposure through entertainment.',
  },

  'ai-podcast': {
    niche: 'ai-podcast',
    label: 'AI Podcast Clips',
    tagline: 'Insight extracts. Thought leadership.',
    inspiration: [],
    scriptDefaults: {
      tone: 'professional',
      platform: 'tiktok',
      hookStyle: 'Question',
      ctaStyle: 'Follow for more',
      duration: 45,
      audience: 'Tech founders, AI curious professionals 25–40',
    },
    imageDefaults: {
      style: 'product-shot',
      aspectRatio: '9:16',
    },
    voiceDefaults: {
      emotion: 'authoritative',
    },
    videoDefaults: {
      cameraMotion: 'static',
      style: 'ugc-authentic',
      duration: 45,
    },
    colorAccent: '#00c8e0',
    description: 'Educational insight extracts, 9:16 vertical, animated captions. Authentic conversational voice.',
  },

  'trader-lifestyle': {
    niche: 'trader-lifestyle',
    label: 'Trader Lifestyle',
    tagline: 'Cinematic flex. Aspirational wealth.',
    inspiration: [],
    scriptDefaults: {
      tone: 'cinematic',
      platform: 'tiktok',
      hookStyle: 'Shocking stat',
      ctaStyle: 'Link in bio',
      duration: 60,
      audience: 'Aspiring traders 20–35, finance bros, hustle culture',
    },
    imageDefaults: {
      style: 'cinematic',
      aspectRatio: '9:16',
    },
    voiceDefaults: {
      emotion: 'dramatic',
    },
    videoDefaults: {
      cameraMotion: 'dolly',
      style: 'cinematic',
      duration: 60,
    },
    colorAccent: '#e8920a',
    description: 'Teal-orange cinematic grade. "How I made $X" hooks, Bloomberg terminal B-roll, aggressive jump cuts.',
  },
};

export const NICHE_ORDER: UGCNiche[] = [
  'luxury-aesthetic',
  'crypto-hype',
  'ai-podcast',
  'trader-lifestyle',
];
