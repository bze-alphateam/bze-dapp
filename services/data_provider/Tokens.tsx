import {DenomUnitSDKType, MetadataSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import {getRestClient} from "../Client";
import Long from 'long';
import {getChain, getLastCharsAfterSlash, MAINNET_UDENOM, TESTNET_UDENOM} from "@/utils";
import {EXCLUDED_TOKENS, STABLE_COINS, VERIFIED_TOKENS} from "@/config/verified";
import {IBCTrace} from '@chain-registry/types';

const DENOM_METADATA_LIMIT = 5000;
const TOKEN_IMG_DEFAULT = 'token_placeholder.png';

export interface Token {
    metadata: MetadataSDKType,
    logo: string,
    verified: boolean,
    type: string,
    coingekoId?: string,
    stableCoin?: boolean,
    ibcTrace?: IBCTrace,
}

async function getChainMetadatas(): Promise<MetadataSDKType[]> {
    try {
        const client = await getRestClient();
        //@ts-ignore
        let response = await client.cosmos.bank.v1beta1.denomsMetadata({pagination: {limit: Long.ZERO.add(DENOM_METADATA_LIMIT)}});
        return response.metadatas;
    } catch (e) {
        console.error(e);
    }

    return [];
}

export async function getFactoryTokens(): Promise<Map<string, Token>> {
    let cachedFactoryTokens = new Map();

    try {
        let metadatas = await getChainMetadatas();
        for (let i = 0; i < metadatas.length; i++) {
            //exclude metadata for tokens without base (should never be possible) and those that are not minted with factory
            if (metadatas[i].base === "" || !metadatas[i].base.startsWith('factory')) continue;
            if (EXCLUDED_TOKENS[metadatas[i].base]) continue;

            let meta = {
                metadata: metadatas[i],
                logo: TOKEN_IMG_DEFAULT,
                verified: isVerified(metadatas[i].base),
                type: getDenomType(metadatas[i].base),
                stableCoin: STABLE_COINS[metadatas[i].base] ?? false,
            }

            if (meta.metadata.symbol === "") {
                meta.metadata.symbol = getLastCharsAfterSlash(meta.metadata.base);
            }

            if (meta.metadata.name === "") {
                meta.metadata.name = meta.metadata.base;
            }

            cachedFactoryTokens.set(metadatas[i].base, meta)
        }

        //override metadata with details from chain registry
        let chain = await getChain();
        for (let i = 0; i < chain.assets.length; i++) {
            for (let j = 0; j < chain.assets[i].assets.length; j++) {
                let chainAsset = chain.assets[i].assets[j];
                let meta = cachedFactoryTokens.get(chainAsset.base)
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

                cachedFactoryTokens.set(chainAsset.base, meta)
            }
        }

        return cachedFactoryTokens;
    } catch (e) {
        console.error(e);
        return new Map();
    }
}

export async function getTokenChainMetadata(denom: string): Promise<MetadataSDKType | undefined> {
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
    try {
        const client = await getRestClient();
        //@ts-ignore
        let res = await client.cosmos.bank.v1beta1.totalSupply({pagination: {limit: Long.fromNumber(DENOM_METADATA_LIMIT)}})

        let allDenomsSupply = res.supply;

        return allDenomsSupply;
    } catch (e) {
        console.error(e);

        return [];
    }
}

export function resetSupplyCache() {

}

export function resetMetadataCache() {

}

export function resetAllTokensCache() {
    resetMetadataCache();
    resetSupplyCache();
}

export async function getTokenSupply(denom: string): Promise<string> {
    let all = await getSupply();
    let filtered = all.filter((item) => item.denom === denom);

    return filtered.length > 0 ? filtered[0].amount : "0";
}

export async function getTokenDisplayDenom(denom: string, token?: Token): Promise<DenomUnitSDKType> {
    let details = token;
    if (details === undefined) {
        const all = await getAllSupplyTokens();
        details = all.get(denom);
        if (details === undefined) {
            return {
                denom: denom,
                exponent: 0,
                aliases: [],
            };
        }
    }

    if (details.metadata.display === "") {
        return {
            denom: details.metadata.base,
            exponent: 0,
            aliases: [],
        };
    }

    const filtered = details.metadata.denom_units.find((item) => item.denom === details?.metadata.display);
    if (filtered === undefined) {
        //should never happen
        return {
            denom: details.metadata.base,
            exponent: 0,
            aliases: [],
        };
    }

    return filtered;
}

export async function getAllSupplyTokens(): Promise<Map<string, Token>> {
    const [factoryTokens, fetchedSupply] = await Promise.all([getFactoryTokens(), getSupply()]);
    let allSupplyTokens = factoryTokens;
    //override metadata with details from chain registry
    let chain = await getChain();
    for (let a = 0; a < fetchedSupply.length; a++) {
        let current = fetchedSupply[a];
        let foundInFactory = factoryTokens.get(current.denom)
        if (foundInFactory !== undefined) {
            continue;
        }

        for (let i = 0; i < chain.assets.length; i++) {
            for (let j = 0; j < chain.assets[i].assets.length; j++) {
                let chainAsset = chain.assets[i].assets[j];
                if (chainAsset.base !== current.denom) {
                    continue;
                }

                let meta = {
                    metadata: {
                        base: current.denom,
                        denom_units: [],
                        display: '',
                        symbol: '',
                        name: '',
                        description: '',
                        uri: '',
                        uri_hash: '',
                    },
                    logo: TOKEN_IMG_DEFAULT,
                    verified: isVerified(current.denom) || isIBCType(current.denom),
                    coingekoId: '',
                    type: getDenomType(current.denom),
                    stableCoin: STABLE_COINS[current.denom] ?? false,
                }

                meta.metadata.denom_units = chainAsset.denom_units;
                meta.metadata.display = chainAsset.display;
                meta.metadata.symbol = chainAsset.symbol;
                meta.metadata.name = chainAsset.name;
                if (chainAsset.description !== undefined) {
                    meta.metadata.description = chainAsset.description;
                }

                if (chainAsset.logo_URIs?.png) {
                    meta.logo = chainAsset.logo_URIs.png;
                }

                if (chainAsset.coingecko_id !== '') {
                    meta.coingekoId = chainAsset.coingecko_id;
                }

                if (isIBCType(current.denom) && chainAsset.traces && Array.isArray(chainAsset.traces)) {
                    // @ts-ignore
                    const ibcTrace = chainAsset.traces.find(item => item.type === "ibc");
                    if (ibcTrace) {
                        // @ts-ignore
                        meta.ibcTrace = ibcTrace;
                    }
                }

                allSupplyTokens.set(chainAsset.base, meta)
            }
        }
    }

    return allSupplyTokens;
}

export function isVerified(denom: string): boolean {
    if (isIBCType(denom) || isNativeType(denom)) {
        return true;
    }

    return VERIFIED_TOKENS[denom] ?? false
}

export function getDenomType(denom: string): string {
    if (isIBCType(denom)) {
        return 'IBC';
    }

    if (isFactoryType(denom)) {
        return 'Factory';
    }

    if (isNativeType(denom)) {
        return 'Native';
    }

    return 'Unknown';
}

export function isNativeType(denom: string): boolean {
    return denom === TESTNET_UDENOM || denom === MAINNET_UDENOM;
}

export function isFactoryType(denom: string): boolean {
    if (!denom) {
        return false;
    }

    return denom.startsWith('factory/');
}

export function isIBCType(denom: string): boolean {
    return denom.startsWith('ibc/');
}

export function sortAssets(assets: Token[]): Token[] {
    return assets.sort((token1, token2) => {
        if (isNativeType(token1.metadata.base)) {
            return -1;
        }

        if (token1.verified && !token2.verified) {
            return -1;
        }

        if (token2.verified && !token1.verified) {
            return 1;
        }

        return token1.metadata.name > token2.metadata.name ? 1 : -1;
    });
}
