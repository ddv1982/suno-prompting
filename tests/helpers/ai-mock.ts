import type { generateText as generateTextType } from 'ai';

type GenerateTextFn = typeof generateTextType;

type GlobalWithAiMock = typeof globalThis & {
  __aiGenerateTextMock?: GenerateTextFn;
};

const globalWithAiMock = globalThis as GlobalWithAiMock;

export function setAiGenerateTextMock(fn: GenerateTextFn): void {
  globalWithAiMock.__aiGenerateTextMock = fn;
}
