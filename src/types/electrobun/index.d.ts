export type RPCSchema<T extends { requests: Record<string, unknown>; messages: Record<string, unknown> }> = T;
