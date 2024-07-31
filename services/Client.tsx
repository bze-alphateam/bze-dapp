
import { getChainName } from '@/utils';
import { bze, getSigningBzeClient } from '@bze/bzejs';

function getRestURL(): string {
  return process.env.NEXT_PUBLIC_REST_URL !== undefined ? process.env.NEXT_PUBLIC_REST_URL : '';
}

export function getRpcURL(): string {
  return process.env.NEXT_PUBLIC_RPC_URL !== undefined ? process.env.NEXT_PUBLIC_RPC_URL : '';
}

export function getArchwayRpcURL(): string {
  return process.env.NEXT_PUBLIC_RPC_URL_ARCHWAY !== undefined ? process.env.NEXT_PUBLIC_RPC_URL_ARCHWAY : '';
}

export function getOsmosisRpcUrl(): string {
  return process.env.NEXT_PUBLIC_RPC_URL_OSMOSIS !== undefined ? process.env.NEXT_PUBLIC_RPC_URL_OSMOSIS : '';
}

export async function getRestClient() {
  return bze.ClientFactory.createLCDClient({restEndpoint: getRestURL()})
}

export async function getSigningClient(offlineSigner: any, chainName?: string): Promise<Awaited<ReturnType<typeof getSigningBzeClient>>> {
  switch (chainName) {
    case getChainName(): 
      return getSigningBzeClient({rpcEndpoint: getRpcURL(), signer: offlineSigner});
    case 'archway':
      return getSigningBzeClient({rpcEndpoint: getArchwayRpcURL(), signer: offlineSigner});
    case 'osmosis':
      return getSigningBzeClient({rpcEndpoint: getOsmosisRpcUrl(), signer: offlineSigner});
    default:
      return getSigningBzeClient({rpcEndpoint: getRpcURL(), signer: offlineSigner});
  }
}
