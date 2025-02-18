import {getChainName} from '@/utils';
import {bze, getSigningBzeClient, getSigningIbcClient} from '@bze/bzejs';

export function getRestURL(): string {
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

export function getNobleRpcUrl(): string {
    return process.env.NEXT_PUBLIC_RPC_URL_NOBLE !== undefined ? process.env.NEXT_PUBLIC_RPC_URL_NOBLE : '';
}

export function getJackalRpcUrl(): string {
    return process.env.NEXT_PUBLIC_RPC_URL_JACKAL !== undefined ? process.env.NEXT_PUBLIC_RPC_URL_JACKAL : '';
}

export function getOmniFlixRpcUrl(): string {
    return process.env.NEXT_PUBLIC_RPC_URL_FLIX !== undefined ? process.env.NEXT_PUBLIC_RPC_URL_FLIX : '';
}

export function getAtomOneRpcUrl(): string {
    return process.env.NEXT_PUBLIC_RPC_URL_ATOMONE !== undefined ? process.env.NEXT_PUBLIC_RPC_URL_ATOMONE : '';
}

export async function getRestClient() {
    return bze.ClientFactory.createLCDClient({restEndpoint: getRestURL()})
}

export function getArchwayRestURL(): string {
    return process.env.NEXT_PUBLIC_REST_URL_ARCHWAY !== undefined ? process.env.NEXT_PUBLIC_REST_URL_ARCHWAY : '';
}

export function getOsmosisRestURL(): string {
    return process.env.NEXT_PUBLIC_REST_URL_OSMOSIS !== undefined ? process.env.NEXT_PUBLIC_REST_URL_OSMOSIS : '';
}

export function getNobleRestURL(): string {
    return process.env.NEXT_PUBLIC_REST_URL_NOBLE !== undefined ? process.env.NEXT_PUBLIC_REST_URL_NOBLE : '';
}

export function getJackalRestURL(): string {
    return process.env.NEXT_PUBLIC_REST_URL_JACKAL !== undefined ? process.env.NEXT_PUBLIC_REST_URL_JACKAL : '';
}

export function getOmniFlixRestURL(): string {
    return process.env.NEXT_PUBLIC_REST_URL_FLIX !== undefined ? process.env.NEXT_PUBLIC_REST_URL_FLIX : '';
}

export function getAtomOneRestURL(): string {
    return process.env.NEXT_PUBLIC_REST_URL_ATOMONE !== undefined ? process.env.NEXT_PUBLIC_REST_URL_ATOMONE : '';
}

export async function getCounterpartyRestClient(chainName: string) {
    if (chainName === "" || chainName === getChainName()) {
        return bze.ClientFactory.createLCDClient({restEndpoint: getRestURL()})
    }

    switch (chainName) {
        case getChainName():
            return bze.ClientFactory.createLCDClient({restEndpoint: getRestURL()})
        case 'archway':
            return bze.ClientFactory.createLCDClient({restEndpoint: getArchwayRestURL()})
        case 'osmosis':
            return bze.ClientFactory.createLCDClient({restEndpoint: getOsmosisRestURL()})
        case 'noble':
            return bze.ClientFactory.createLCDClient({restEndpoint: getNobleRestURL()})
        case 'jackal':
            return bze.ClientFactory.createLCDClient({restEndpoint: getJackalRestURL()})
        case 'omniflixhub':
            return bze.ClientFactory.createLCDClient({restEndpoint: getOmniFlixRestURL()})
        case 'atomone':
            return bze.ClientFactory.createLCDClient({restEndpoint: getAtomOneRestURL()})
        default:
            return bze.ClientFactory.createLCDClient({restEndpoint: getRestURL()})
    }
}

export async function getSigningClient(offlineSigner: any, chainName?: string, isIbc?: boolean): Promise<Awaited<ReturnType<typeof getSigningBzeClient>>> {
    let clientFn = getSigningBzeClient
    if (isIbc) {
        clientFn = getSigningIbcClient
    }

    switch (chainName) {
        case getChainName():
            return clientFn({rpcEndpoint: getRpcURL(), signer: offlineSigner});
        case 'archway':
            return clientFn({rpcEndpoint: getArchwayRpcURL(), signer: offlineSigner});
        case 'osmosis':
            return clientFn({rpcEndpoint: getOsmosisRpcUrl(), signer: offlineSigner});
        case 'noble':
            return clientFn({rpcEndpoint: getNobleRpcUrl(), signer: offlineSigner});
        case 'jackal':
            return clientFn({rpcEndpoint: getJackalRpcUrl(), signer: offlineSigner});
        case 'omniflixhub':
            return clientFn({rpcEndpoint: getOmniFlixRpcUrl(), signer: offlineSigner});
        case 'atomone':
            return clientFn({rpcEndpoint: getAtomOneRpcUrl(), signer: offlineSigner});
        default:
            return clientFn({rpcEndpoint: getRpcURL(), signer: offlineSigner});
    }
}
