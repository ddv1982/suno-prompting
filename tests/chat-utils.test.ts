import { describe, test, expect } from 'bun:test';

import { buildChatMessages } from '../src/main-ui/lib/chat-utils';
import { type PromptSession } from '../src/shared/types';

function createSession(overrides: Partial<PromptSession> = {}): PromptSession {
  return {
    id: 'test-session',
    originalInput: 'funky jazz ballad',
    currentPrompt: 'test prompt',
    versionHistory: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('buildChatMessages', () => {
  test('shows project initialized message', () => {
    const session = createSession({
      versionHistory: [{ id: 'v1', content: 'prompt', timestamp: '2024-01-01T00:00:00Z' }],
    });

    const messages = buildChatMessages(session);

    expect(messages[0]).toEqual({
      role: 'ai',
      content: 'Project initialized: "funky jazz ballad"',
    });
  });

  test('initial version shows Generated prompt without title/lyrics', () => {
    const session = createSession({
      versionHistory: [{ id: 'v1', content: 'prompt', timestamp: '2024-01-01T00:00:00Z' }],
    });

    const messages = buildChatMessages(session);

    expect(messages[1]).toEqual({ role: 'ai', content: 'Generated prompt.' });
  });

  test('initial version shows title when present', () => {
    const session = createSession({
      versionHistory: [
        { id: 'v1', content: 'prompt', title: 'Epic Voyage', timestamp: '2024-01-01T00:00:00Z' },
      ],
    });

    const messages = buildChatMessages(session);

    expect(messages[1]).toEqual({ role: 'ai', content: 'Generated prompt - "Epic Voyage".' });
  });

  test('initial version shows with lyrics when present', () => {
    const session = createSession({
      versionHistory: [
        { id: 'v1', content: 'prompt', lyrics: '[VERSE]\nTest', timestamp: '2024-01-01T00:00:00Z' },
      ],
    });

    const messages = buildChatMessages(session);

    expect(messages[1]).toEqual({ role: 'ai', content: 'Generated prompt with lyrics.' });
  });

  test('initial version shows title and lyrics when both present', () => {
    const session = createSession({
      versionHistory: [
        {
          id: 'v1',
          content: 'prompt',
          title: 'Epic Voyage',
          lyrics: '[VERSE]\nTest',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
    });

    const messages = buildChatMessages(session);

    expect(messages[1]).toEqual({
      role: 'ai',
      content: 'Generated prompt - "Epic Voyage" with lyrics.',
    });
  });

  test('refinement shows user feedback and Refined prompt', () => {
    const session = createSession({
      versionHistory: [
        { id: 'v1', content: 'prompt1', title: 'Title 1', timestamp: '2024-01-01T00:00:00Z' },
        {
          id: 'v2',
          content: 'prompt2',
          title: 'Title 2',
          feedback: 'make it more epic',
          timestamp: '2024-01-01T00:01:00Z',
        },
      ],
    });

    const messages = buildChatMessages(session);

    expect(messages).toHaveLength(4);
    expect(messages[2]).toEqual({ role: 'user', content: 'make it more epic' });
    expect(messages[3]).toEqual({ role: 'ai', content: 'Refined prompt - "Title 2".' });
  });

  test('shows locked phrase messages', () => {
    const session = createSession({
      versionHistory: [
        {
          id: 'v1',
          content: 'prompt',
          lockedPhrase: 'synthwave',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
    });

    const messages = buildChatMessages(session);

    expect(messages[1]).toEqual({ role: 'ai', content: 'Locked: "synthwave"' });
    expect(messages[2]).toEqual({ role: 'ai', content: 'Generated prompt.' });
  });

  test('multiple refinements build correct message history', () => {
    const session = createSession({
      versionHistory: [
        { id: 'v1', content: 'prompt1', title: 'Title 1', timestamp: '2024-01-01T00:00:00Z' },
        {
          id: 'v2',
          content: 'prompt2',
          title: 'Title 2',
          feedback: 'more epic',
          timestamp: '2024-01-01T00:01:00Z',
        },
        {
          id: 'v3',
          content: 'prompt3',
          title: 'Title 3',
          lyrics: '[VERSE]\nTest',
          feedback: 'add lyrics',
          timestamp: '2024-01-01T00:02:00Z',
        },
      ],
    });

    const messages = buildChatMessages(session);

    expect(messages).toHaveLength(6);
    expect(messages[0]!.content).toBe('Project initialized: "funky jazz ballad"');
    expect(messages[1]!.content).toBe('Generated prompt - "Title 1".');
    expect(messages[2]!.content).toBe('more epic');
    expect(messages[3]!.content).toBe('Refined prompt - "Title 2".');
    expect(messages[4]!.content).toBe('add lyrics');
    expect(messages[5]!.content).toBe('Refined prompt - "Title 3" with lyrics.');
  });
});
