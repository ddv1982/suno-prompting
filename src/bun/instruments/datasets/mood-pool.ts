export const MOOD_POOL = [
  // Energetic
  'euphoric', 'explosive', 'triumphant', 'exhilarating', 'electrifying', 'uplifting',
  // Calm
  'serene', 'peaceful', 'tranquil', 'meditative', 'soothing', 'gentle',
  // Dark
  'haunting', 'sinister', 'ominous', 'menacing', 'foreboding',
  // Emotional
  'melancholic', 'wistful', 'bittersweet', 'yearning', 'nostalgic', 'tender',
  // Playful
  'whimsical', 'mischievous', 'carefree', 'lighthearted', 'jovial', 'quirky',
  // Intense
  'passionate', 'fierce', 'relentless', 'urgent', 'raw', 'visceral',
  // Atmospheric
  'ethereal', 'dreamy', 'mysterious', 'hypnotic', 'otherworldly', 'cosmic',
  // Additional variety
  'introspective', 'defiant', 'hopeful', 'rebellious', 'contemplative', 'cinematic',
  // Atmosphere (research-backed for Suno V5)
  'atmospheric', 'surreal', 'luminous', 'shimmering', 'immersive',
  // Texture
  'layered', 'textured', 'dense', 'crisp', 'airy', 'fluid',
  // Movement
  'flowing', 'pulsating', 'evolving', 'building', 'swelling',
] as const;

export type Mood = typeof MOOD_POOL[number];
