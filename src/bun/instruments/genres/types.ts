export interface InstrumentPool {
  readonly pick: { readonly min: number; readonly max: number };
  readonly instruments: readonly string[];
  readonly chanceToInclude?: number;
}

export interface BpmRange {
  readonly min: number;
  readonly max: number;
  readonly typical: number;
}

export interface GenreDefinition {
  readonly name: string;
  readonly keywords: readonly string[];
  readonly description: string;
  readonly pools: Record<string, InstrumentPool>;
  readonly poolOrder: readonly string[];
  readonly maxTags: number;
  readonly exclusionRules?: readonly [string, string][];
  readonly bpm?: BpmRange;
  readonly moods?: readonly string[];
}
