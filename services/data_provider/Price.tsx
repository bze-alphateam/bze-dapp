import {getFromCache, setInCache} from "./cache";

const PRICE_PATH = '/api/prices';

const usdPriceDenom = "usd";
const usdPriceCacheKey = "price:usd";
const priceCacheTtl = 2 * 60; //15 minutes

interface PriceApiResponse {
    denom: string;
    price: number;
    price_denom: string;
}

const getHost = (): string => {
    return process.env.NEXT_PUBLIC_AGG_API_HOST ?? "";
}

const getPriceUrl = (): string => {
    return `${getHost()}${PRICE_PATH}`;
}

const getAssetPriceCacheKey = (asset: string): string => {
    return `${usdPriceCacheKey}:${asset};`
}

export const fetchAssetUsdPrice = async (asset: string): Promise<PriceApiResponse | undefined> => {
    const host = getHost();
    if (host === "") {
        return undefined;
    }

    const cacheKey = getAssetPriceCacheKey(asset);
    const cached = getFromCache(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    try {
        const resp = await fetch(getPriceUrl());
        if (resp.status !== 200) {
            return undefined
        }

        const decodedResp = await resp.json();
        const result = decodedResp.find((item: PriceApiResponse) => item.denom === asset && item.price_denom === usdPriceDenom);

        setInCache(cacheKey, JSON.stringify(result), priceCacheTtl);

        return result;

    } catch (e) {
        console.log("error on getAssetUsdPrice: ", e);

        return undefined;
    }
}
