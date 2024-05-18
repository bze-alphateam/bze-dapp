import { DenomUnitSDKType, MetadataSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import { getRestClient } from "../Client";
import Long from 'long';
import { getChain, getLastCharsAfterSlash } from "@/utils";
import { VERIFIED_TOKENS } from "@/config/verified";
import { CoinSDKType } from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";

const DENOM_METADATA_LIMIT = 5000;
const TOKEN_IMG_DEFAULT = 'token_placeholder.png';

export interface Token {
  metadata: MetadataSDKType,
  logo: string,
  verified: boolean,
  coingekoId?: string,
}

let cachedTokens: Map<string, Token>;
let cachedChainMetadata: MetadataSDKType[] = [];
let allDenomsSupply: CoinSDKType[] = [];

async function getChainMetadatas(): Promise<MetadataSDKType[]> {
  if (cachedChainMetadata.length !== 0) {
    // return cachedChainMetadata;
  }

  try {
    const client = await getRestClient();
    {/* @ts-ignore */}
    let response = await client.cosmos.bank.v1beta1.denomsMetadata({pagination: {limit: Long.ZERO.add(DENOM_METADATA_LIMIT)}});
    cachedChainMetadata = response.metadatas;
  } catch (e) {
    console.error(e);
  }

  return cachedChainMetadata;
}

export async function getAllTokens(): Promise<Map<string, Token>> {
  if (cachedTokens !== undefined) {
    // return cachedTokens;
  }

  cachedTokens = new Map();

  try {
    let metadatas = await getChainMetadatas();
    for (let i = 0; i < metadatas.length; i++) {
      //exclude metadata for okens without base (should never be possible) and those that are not minted with factory
      if (metadatas[i].base === "" || !metadatas[i].base.startsWith('factory')) {
        continue;
      }

      let meta = {
        metadata: metadatas[i],
        logo: TOKEN_IMG_DEFAULT,
        verified: VERIFIED_TOKENS[metadatas[i].base] ?? false,
      }

      if (meta.metadata.symbol === "") {
        meta.metadata.symbol = getLastCharsAfterSlash(meta.metadata.base);
      }

      if (meta.metadata.name === "") {
        meta.metadata.name = meta.metadata.base;
      }

      cachedTokens.set(metadatas[i].base, meta)
    }

     //override metadata with details from chain registry
    let chain = getChain();
    for (let i = 0; i < chain.assets; i++) {
      for (let j = 0; j < 0; j++) {
        let chainAsset = chain.assets[i].assets[j];
        let meta = cachedTokens.get(chainAsset.base)
        if (meta === undefined) {
          continue;
        }
        
        meta.metadata.denom_units = chainAsset.denom_units;
        meta.metadata.display = chainAsset.display;
        meta.metadata.symbol = chainAsset.symbol;
        meta.metadata.name = chainAsset.name;
        if (chainAsset.description === undefined) {
          meta.metadata.description = chainAsset.description;
        }
        
        if (chainAsset.logo_URIs?.png) {
          meta.logo = chainAsset.logo_URIs.png;
        }

        if (chainAsset.coingecko_id !== '') {
          meta.coingekoId = chainAsset.coingecko_id;
        }
        
        cachedTokens.set(chainAsset.base, meta)
      }
    }

    return cachedTokens;
  } catch(e) {
    console.error(e);
    return new Map();
  }
} 

export async function getTokenChainMetadata(denom: string): Promise<MetadataSDKType|undefined> {
  let metadatas = await getChainMetadatas();
  let filtered = metadatas.filter((item) => item.base === denom);

  return filtered.length > 0 ? filtered[0] : undefined;
}

export async function getTokenAdminAddress(denom: string): Promise<string> {
  try {
    const client = await getRestClient();
    let res = await client.bze.tokenfactory.v1.denomAuthority({denom: denom});

    return res.denomAuthority?.admin ?? ''
  } catch (e) {
    console.error(e);

    return '';
  }
}

async function getSupply() {
  if (allDenomsSupply.length > 0) {
    return allDenomsSupply;
  }

  try {
    const client = await getRestClient();
     {/* @ts-ignore */}
    let res = await client.cosmos.bank.v1beta1.totalSupply({pagination: {limit: Long.fromNumber(DENOM_METADATA_LIMIT)}})

    allDenomsSupply = res.supply;

    return allDenomsSupply;
  } catch (e) {
    console.error(e);

    return [];
  }
}

export async function getTokenSupply(denom: string): Promise<string> {
  let all = await getSupply();
  let filtered = all.filter((item) => item.denom === denom);

  return filtered.length > 0 ? filtered[0].amount : "0";
}

export async function getTokenDisplayDenom(denom: string): Promise<DenomUnitSDKType|undefined> {
  const all = await getAllTokens();
  const details = all.get(denom);
  if (details === undefined) {
    return undefined;
  }
  
  if (details.metadata.display === "") {
    return {
      denom: details.metadata.base,
      exponent: 0,
      aliases: [],
    };
  }

  const filtered = details.metadata.denom_units.filter((item) => item.denom === details.metadata.display);
  if (filtered.length === 0) {
    //should never happen
    return {
      denom: details.metadata.base,
      exponent: 0,
      aliases: [],
    };
  }

  return filtered[0];
}
