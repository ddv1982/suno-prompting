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
    // Electrobun RPC is dynamically keyed: rpc.request[method](params)
    const fn = (rpc.request as Record<string, (p: unknown) => Promise<unknown>>)[
      method as string
    ];

    if (typeof fn !== 'function') {
      return Err(
        mapToRpcError({ status: 404, message: 'RPC method not found' }, { method: method as string })
      );
    }

    const response = (await fn(params)) as ResponseOf<M>;
    return Ok(response);
  } catch (error) {
    return Err(mapToRpcError(error, { method: method as string }));
  }
}
