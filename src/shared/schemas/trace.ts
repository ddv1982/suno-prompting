import { z } from 'zod';

const TraceVersionSchema = z.literal(1);

const TraceRunActionSchema = z.enum([
  'generate.full',
  'generate.quickVibes',
  'generate.creativeBoost',
  'refine',
  'remix',
  'convert.max',
  'convert.nonMax',
]);

const TraceProviderIdSchema = z.enum(['groq', 'openai', 'anthropic', 'ollama']);

const TraceBaseEventSchema = z
  .object({
    id: z.string().min(1),
    ts: z.string().min(1),
    tMs: z.number(),
  })
  .strict();

const TraceRunEventSchema = TraceBaseEventSchema.extend({
  type: z.enum(['run.start', 'run.end']),
  summary: z.string(),
}).strict();

const TraceDecisionEventSchema = TraceBaseEventSchema.extend({
  type: z.literal('decision'),
  domain: z.enum(['genre', 'mood', 'instruments', 'styleTags', 'recording', 'bpm', 'other']),
  key: z.string().min(1),
  branchTaken: z.string(),
  why: z.string(),
  selection: z
    .object({
      method: z.enum(['pickRandom', 'shuffleSlice', 'weightedChance', 'index']),
      chosenIndex: z.number().int().nonnegative().optional(),
      candidatesCount: z.number().int().nonnegative().optional(),
      candidatesPreview: z.array(z.string()).readonly().optional(),
      rolls: z.array(z.number()).readonly().optional(),
    })
    .strict()
    .optional(),
}).strict();

const TraceMessageSchema = z
  .object({
    role: z.enum(['system', 'user', 'assistant', 'tool']),
    content: z.string(),
  })
  .strict();

const TraceLLMCallEventSchema = TraceBaseEventSchema.extend({
  type: z.literal('llm.call'),
  label: z.string().min(1),
  provider: z
    .object({
      id: TraceProviderIdSchema,
      model: z.string().min(1),
      locality: z.enum(['cloud', 'local']),
    })
    .strict(),
  request: z
    .object({
      temperature: z.number().optional(),
      maxTokens: z.number().int().positive().optional(),
      maxRetries: z.number().int().nonnegative().optional(),
      providerOptions: z.record(z.string(), z.unknown()).optional(),
      inputSummary: z
        .object({
          messageCount: z.number().int().nonnegative(),
          totalChars: z.number().int().nonnegative(),
          preview: z.string(),
        })
        .strict(),
      messages: z.array(TraceMessageSchema).optional(),
    })
    .strict(),
  response: z
    .object({
      previewText: z.string(),
      rawText: z.string().optional(),
    })
    .strict(),
  telemetry: z
    .object({
      latencyMs: z.number().int().nonnegative().optional(),
      finishReason: z.string().optional(),
      tokensIn: z.number().int().nonnegative().optional(),
      tokensOut: z.number().int().nonnegative().optional(),
    })
    .strict()
    .optional(),
  attempts: z
    .array(
      z
        .object({
          attempt: z.number().int().positive(),
          startedAt: z.string().min(1),
          endedAt: z.string().min(1),
          latencyMs: z.number().int().nonnegative(),
          error: z
            .object({
              type: z.string().min(1),
              message: z.string(),
              status: z.number().int().optional(),
              providerRequestId: z.string().optional(),
            })
            .strict()
            .optional(),
        })
        .strict()
    )
    .optional(),
}).strict();

const TraceErrorEventSchema = TraceBaseEventSchema.extend({
  type: z.literal('error'),
  error: z
    .object({
      type: z.enum([
        'validation',
        'ollama.unavailable',
        'ollama.model_missing',
        'ollama.timeout',
        'ai.generation',
        'storage',
        'invariant',
        'unknown',
      ]),
      message: z.string(),
      status: z.number().int().optional(),
      providerRequestId: z.string().optional(),
    })
    .strict(),
}).strict();

const TraceEventSchema = z.discriminatedUnion('type', [
  TraceRunEventSchema,
  TraceDecisionEventSchema,
  TraceLLMCallEventSchema,
  TraceErrorEventSchema,
]);

export const TraceRunSchema = z
  .object({
    version: TraceVersionSchema,
    runId: z.string().min(1),
    capturedAt: z.string().min(1),
    action: TraceRunActionSchema,
    promptMode: z.enum(['full', 'quickVibes', 'creativeBoost']),
    rng: z
      .object({
        seed: z.number().int(),
        algorithm: z.enum(['mulberry32', 'lcg', 'other']),
      })
      .strict(),
    stats: z
      .object({
        eventCount: z.number().int().nonnegative(),
        llmCallCount: z.number().int().nonnegative(),
        decisionCount: z.number().int().nonnegative(),
        hadErrors: z.boolean(),
        persistedBytes: z.number().int().nonnegative(),
        truncatedForCap: z.boolean(),
      })
      .strict(),
    events: z.array(TraceEventSchema),
  })
  .strict();

/** Alias to match spec/task wording. */
export const zTraceRun = TraceRunSchema;

export type TraceRunInput = z.infer<typeof TraceRunSchema>;
