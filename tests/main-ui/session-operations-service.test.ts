import { describe, expect, test } from 'bun:test';

import {
  EMPTY_CREATIVE_BOOST_INPUT,
  type CreativeBoostInput,
  type PromptSession,
  type QuickVibesInput,
} from '@shared/types';

import { createSessionOperationsService } from '@/services/session-operations-service';

const baseVersion = {
  id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc010',
  content: 'prompt',
  timestamp: '2026-01-01T00:00:00Z',
};

const creativeBoostSession: PromptSession = {
  id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc011',
  originalInput: 'creative boost session',
  currentPrompt: 'prompt',
  versionHistory: [baseVersion],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  promptMode: 'creativeBoost',
  creativeBoostInput: {
    creativityLevel: 75,
    seedGenres: ['rock'],
    sunoStyles: [],
    description: 'desc',
    lyricsTopic: 'topic',
    moodCategory: null,
  },
};

const fullSession: PromptSession = {
  id: '0f4f1b4b-737b-4f2c-bf3f-72aa0d6bc012',
  originalInput: 'full session',
  currentPrompt: 'prompt',
  versionHistory: [baseVersion],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  promptMode: 'full',
};

const EMPTY_QUICK_VIBES_INPUT: QuickVibesInput = {
  category: null,
  customDescription: '',
  sunoStyles: [],
  moodCategory: null,
};

function createHarness() {
  let currentSession: PromptSession | null = null;
  let quickVibesInput: QuickVibesInput = {
    category: null,
    customDescription: 'queued quick vibes',
    sunoStyles: ['dreampop'],
    moodCategory: null,
  };
  let creativeBoostInput: CreativeBoostInput = {
    creativityLevel: 100,
    seedGenres: ['rock'],
    sunoStyles: [],
    description: 'stale creative boost state',
    lyricsTopic: 'topic',
    moodCategory: null,
  };
  let lyricsTopic = 'seed topic';
  let promptMode: 'full' | 'quickVibes' | 'creativeBoost' = 'full';
  let chatMessages: unknown[] = [];
  let validation: unknown = null;

  const service = createSessionOperationsService({
    currentSession,
    setCurrentSession: (session) => {
      currentSession = session;
    },
    saveSession: async () => {},
    generateId: () => 'generated-id',
    resetEditor: () => {},
    setLyricsTopic: (value) => {
      lyricsTopic = value;
    },
    setPromptMode: (mode) => {
      promptMode = mode;
    },
    setQuickVibesInput: (input) => {
      quickVibesInput = input;
    },
    resetQuickVibesInput: () => {
      quickVibesInput = EMPTY_QUICK_VIBES_INPUT;
    },
    setCreativeBoostInput: (input) => {
      creativeBoostInput = input;
    },
    resetCreativeBoostInput: () => {
      creativeBoostInput = EMPTY_CREATIVE_BOOST_INPUT;
    },
    setChatMessages: (next) => {
      chatMessages = typeof next === 'function' ? next(chatMessages as never[]) : next;
    },
    setValidation: (next) => {
      validation = next;
    },
    setDebugTrace: () => {},
  });

  return {
    service,
    getState: () => ({
      currentSession,
      quickVibesInput,
      creativeBoostInput,
      lyricsTopic,
      promptMode,
      chatMessages,
      validation,
    }),
  };
}

describe('createSessionOperationsService', () => {
  test('selecting a creative boost session resets quick vibes state', () => {
    const { service, getState } = createHarness();

    service.selectSession(creativeBoostSession);

    expect(getState().currentSession).toEqual(creativeBoostSession);
    expect(getState().creativeBoostInput).toEqual(creativeBoostSession.creativeBoostInput!);
    expect(getState().quickVibesInput).toEqual(EMPTY_QUICK_VIBES_INPUT);
    expect(getState().promptMode).toBe('creativeBoost');
    expect(getState().lyricsTopic).toBe('');
  });

  test('selecting a non-mode session resets both quick vibes and creative boost state', () => {
    const { service, getState } = createHarness();

    service.selectSession(fullSession);

    expect(getState().currentSession).toEqual(fullSession);
    expect(getState().quickVibesInput).toEqual(EMPTY_QUICK_VIBES_INPUT);
    expect(getState().creativeBoostInput).toEqual(EMPTY_CREATIVE_BOOST_INPUT);
    expect(getState().promptMode).toBe('full');
    expect(getState().lyricsTopic).toBe('');
  });
});
