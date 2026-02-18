import { Electroview } from 'electrobun/view';

import { APP_CONSTANTS } from '@shared/constants';
import { Err, Ok } from '@shared/types/result';

import { mapToRpcError, type RpcError } from './errors';

import type { SunoRPCSchema } from '@shared/types';
import type { Result } from '@shared/types/result';

const rpc = Electroview.defineRPC<SunoRPCSchema>({
  maxRequestTime: APP_CONSTANTS.AI.TIMEOUT_MS,
  handlers: {
    requests: {},
    messages: {},
  },
});

new Electroview({ rpc });

type BunRequests = SunoRPCSchema['bun']['requests'];
type RequestMethod = keyof BunRequests;
type ParamsOf<M extends RequestMethod> = BunRequests[M]['params'];
type ResponseOf<M extends RequestMethod> = BunRequests[M]['response'];

export async function request<M extends RequestMethod>(
  method: M,
  params: ParamsOf<M>
): Promise<Result<ResponseOf<M>, RpcError>> {
  try {
    const invoke = rpc.request as unknown as (
      method: M,
      params: ParamsOf<M>
    ) => Promise<ResponseOf<M>>;
    const response = await invoke(method, params);
    return Ok(response);
  } catch (error) {
    return Err(mapToRpcError(error, { method: method as string }));
  }
}
