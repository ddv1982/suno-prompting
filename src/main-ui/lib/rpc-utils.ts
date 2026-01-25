import type { RpcError } from '@/services/rpc-client';

export function formatRpcError(error: RpcError): string {
  return error.message;
}
