import type { extractThematicContext as extractThematicContextType } from '@bun/ai/thematic-context';

type ExtractThematicContextFn = typeof extractThematicContextType;
type ExtractThematicContextMock = (...args: Parameters<ExtractThematicContextFn>) => unknown;

type GlobalWithThematicContextMock = typeof globalThis & {
  __extractThematicContextMock?: ExtractThematicContextFn;
};

const globalWithThematicContextMock = globalThis as GlobalWithThematicContextMock;

export function setExtractThematicContextMock(fn: ExtractThematicContextMock): void {
  globalWithThematicContextMock.__extractThematicContextMock = fn as ExtractThematicContextFn;
}
