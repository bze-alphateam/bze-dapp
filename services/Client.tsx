
import { bze, getSigningBzeClient } from '@bze/bzejs';

function getRestURL(): string {
  return process.env.NEXT_PUBLIC_REST_URL !== undefined ? process.env.NEXT_PUBLIC_REST_URL : '';
}

function getRpcURL(): string {
  return process.env.NEXT_PUBLIC_RPC_URL !== undefined ? process.env.NEXT_PUBLIC_RPC_URL : '';
}

export async function getRestClient() {
  return bze.ClientFactory.createLCDClient({restEndpoint: getRestURL()})
}

export async function getSigningClient(offlineSigner: any): Promise<Awaited<ReturnType<typeof getSigningBzeClient>>> {
  return getSigningBzeClient({rpcEndpoint: getRpcURL(), signer: offlineSigner});
}
