import { MetadataSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import { getRestClient } from "../Client";
import Long from 'long';
import { getChain, getLastCharsAfterSlash } from "@/utils";
import { VERIFIED_TOKENS } from "@/config/verified";

const DENOM_METADATA_LIMIT = 5000;
const TOKEN_IMG_DEFAULT = 'token_placeholder.png';

export interface Token {
  metadata: MetadataSDKType,
  logo: string,
  verified: boolean,
  coingekoId?: string,
}

let cachedTokens: Map<string, Token>;

export async function getAllTokens(): Promise<Map<string, Token>> {
  if (cachedTokens !== undefined) {
    // return cachedTokens;
  }
  cachedTokens = new Map();

  try {
    const client = await getRestClient();
    {/* @ts-ignore */}
    let response = await client.cosmos.bank.v1beta1.denomsMetadata({pagination: {limit: Long.ZERO.add(DENOM_METADATA_LIMIT)}});
    for (let i = 0; i < response.metadatas.length; i++) {
      //exclude metadata for okens without base (should never be possible) and those that are not minted with factory
      if (response.metadatas[i].base === "" || !response.metadatas[i].base.startsWith('factory')) {
        continue;
      }

      let meta = {
        metadata: response.metadatas[i],
        logo: TOKEN_IMG_DEFAULT,
        verified: VERIFIED_TOKENS[response.metadatas[i].base] ?? false,
      }

      if (meta.metadata.symbol === "") {
        meta.metadata.symbol = getLastCharsAfterSlash(meta.metadata.base);
      }

      if (meta.metadata.name === "") {
        meta.metadata.name = meta.metadata.base;
      }

      cachedTokens.set(response.metadatas[i].base, meta)
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