import { getNetwork } from "@/config";

let cachedChain: Map<string, any> = new Map();

export const MAINNET_CHAIN_ID = 'beezee-1';
export const TESTNET_CHAIN_ID = 'bzetestnet-2';

export function isTestnet(): boolean {
  return process.env.NEXT_PUBLIC_CHAIN_ID !== MAINNET_CHAIN_ID;
}

export function isMainnet(): boolean {
  return process.env.NEXT_PUBLIC_CHAIN_ID !== MAINNET_CHAIN_ID;
}

export function getCurrentChainId(): string {
  return process.env.NEXT_PUBLIC_CHAIN_ID ?? '';
}

export function getChain() {
  let currentChainId = getCurrentChainId();
  if (cachedChain.has(currentChainId)) {
    return cachedChain.get(currentChainId);
  }
  
  let data = getNetwork(currentChainId);
  if (isTestnet()) {
    cachedChain.set(currentChainId, data);

    return data;
  }

  data.chain = data.chain.filter((item) => item.chain_id === currentChainId);
  data.assets = data.assets.filter((item) => item.chain_name === data.base.chainName);

  cachedChain.set(currentChainId, data);

  return data;
}
