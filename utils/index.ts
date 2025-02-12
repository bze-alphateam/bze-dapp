import {chains} from 'chain-registry';
import {Asset, Chain} from '@chain-registry/types';

export * from './Amount';
export * from './Denom';
export * from './DateTime';
export * from './Network';
export * from './Functions';
export * from './Market';
export * from './Tendermint';
export * from './Errors';

export function getLogo(from: Asset | Chain) {
    return from.logo_URIs?.svg || from.logo_URIs?.png;
}

export function getChainLogo(name: string) {
    const chain = chains.find(chain => chain.chain_name === name)
    return chain ? getLogo(chain) : null;
}