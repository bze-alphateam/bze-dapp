import { CHAIN_NAME, getNetwork } from "@/config";
import { getFromCache, setInCache } from "@/services/data_provider/cache";
import { Asset } from '@chain-registry/types';

let cachedChain: Map<string, any> = new Map();

const CHAIN_REGISTRY_ASSETS_CACHE_KEY = "chain_registry:assets";
const CHAIN_REGISTRY_CACHE_TTL = 30  * 60; //30 minutes
const CHAIN_REGISTRY_CACHE_TTL_ON_ERROR = 1 * 60; //1 minute

export const MAINNET_CHAIN_ID = 'beezee-1';
export const TESTNET_CHAIN_ID = 'bzetestnet-2';

const getChainRegistryAssetsUrl = (): string => {
  return process.env.NEXT_PUBLIC_CHAIN_REGISTRY_ASSETS_URL ?? "";
}

const getChainRegistryBzeAssets = async (): Promise<Asset[]> => {
  const url = getChainRegistryAssetsUrl();
  if (url === "") {
    return [];
  }

  const cached = getFromCache(CHAIN_REGISTRY_ASSETS_CACHE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);

    return parsed.assets ?? [];
  }

  let data = [];
  let cacheTtl = CHAIN_REGISTRY_CACHE_TTL;
  try {
    const response = await fetch(url);
    if (!response.ok) {
       // cache the empty list in case of response error
        console.error("Error while calling chain registry to get BZE assets");
        cacheTtl = CHAIN_REGISTRY_CACHE_TTL_ON_ERROR;
    } else {
      data = await response.json();
    }
    

  } catch (error) {
    console.error(`Error fetching JSON from ${url}:`, error);
    data = [];
    cacheTtl = CHAIN_REGISTRY_CACHE_TTL_ON_ERROR;
  }

  setInCache(CHAIN_REGISTRY_ASSETS_CACHE_KEY, JSON.stringify(data), cacheTtl);

  return data.assets ?? [];
}

const mergeAssets = (mainAssets: Asset[], extraAssets: Asset[]): Asset[] => {
  //filter out from extra assets those assets already in main
  const filteredExtraAssets = extraAssets.filter(item => mainAssets.find(mItem => mItem.base === item.base) === undefined);

  return [...mainAssets, ...filteredExtraAssets];
}

export function isTestnet(): boolean {
  return process.env.NEXT_PUBLIC_CHAIN_ID !== MAINNET_CHAIN_ID;
}

export function isMainnet(): boolean {
  return process.env.NEXT_PUBLIC_CHAIN_ID === MAINNET_CHAIN_ID;
}

export function getCurrentChainId(): string {
  return process.env.NEXT_PUBLIC_CHAIN_ID ?? '';
}

export async function getChain() {
  let currentChainId = getCurrentChainId();
  if (cachedChain.has(currentChainId)) {
    return cachedChain.get(currentChainId);
  }
  
  let data = getNetwork(currentChainId);
  if (isTestnet()) {
    cachedChain.set(currentChainId, data);

    return data;
  }

  {/* @ts-ignore */}
  data.chain = data.chain.filter((item) => item.chain_id === currentChainId);
  {/* @ts-ignore */}
  let hardcodedAssets = data.assets.filter((item) => item.chain_name === data.base.chainName);
  const chainRegistryAssets = await getChainRegistryBzeAssets();

  {/* @ts-ignore */}
  hardcodedAssets[0].assets = mergeAssets(hardcodedAssets[0].assets, chainRegistryAssets)

  {/* @ts-ignore */}
  data.assets = hardcodedAssets;

  cachedChain.set(currentChainId, data);

  return data;
}

export function getMinDenom(): string {
  return isTestnet() ? 'utbz' : 'ubze';
}

export function getChainName(): string {
  return process.env.NEXT_PUBLIC_CHAIN_NAME ?? CHAIN_NAME;
}
