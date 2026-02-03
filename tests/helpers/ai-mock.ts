import type { generateText as generateTextType } from 'ai';

type GenerateTextFn = typeof generateTextType;
type GenerateTextMock = (...args: Parameters<GenerateTextFn>) => unknown;

type GlobalWithAiMock = typeof globalThis & {
  __aiGenerateTextMock?: GenerateTextFn;
};

const globalWithAiMock = globalThis as GlobalWithAiMock;

export function setAiGenerateTextMock(fn: GenerateTextMock): void {
  globalWithAiMock.__aiGenerateTextMock = fn as GenerateTextFn;
}
