import {
    QueryAllMarketResponseSDKType,
    QueryAssetMarketsResponseSDKType,
    QueryGetMarketResponseSDKType,
    QueryMarketAggregatedOrdersResponseSDKType,
    QueryMarketHistoryResponseSDKType,
    QueryMarketOrderResponseSDKType,
    QueryUserMarketOrdersResponseSDKType
} from "@bze/bzejs/types/codegen/beezee/tradebin/query";
import {getRestClient} from "../Client";
import {bze} from '@bze/bzejs';
import {getFromCache, removeFromCache, setInCache} from "./cache";

const ALL_MARKETS_KEY = 'markets:list';
const ALL_MARKETS_CACHE_TTL = 60 * 5; //5 minutes
const CACHE_TTL_IN_SECONDS = 5 * 60;

const ORDER_TYPE_BUY = 'buy';
const ORDER_TYPE_SELL = 'sell';

const {fromPartial: QueryMarketsFromPartial} = bze.tradebin.v1.QueryAllMarketRequest;
const {fromPartial: QueryMarketAggregatedOrdersRequestFromPartyal} = bze.tradebin.v1.QueryMarketAggregatedOrdersRequest;
const {fromPartial: QueryMarketHistoryRequestFromPartial} = bze.tradebin.v1.QueryMarketHistoryRequest;
const {fromPartial: QueryUserMarketOrdersRequestFromPartial} = bze.tradebin.v1.QueryUserMarketOrdersRequest;
const {fromPartial: QueryMarketOrderRequestFromPartial} = bze.tradebin.v1.QueryMarketOrderRequest;
const {fromPartial: QueryAssetMarketsRequestFromPartial} = bze.tradebin.v1.QueryAssetMarketsRequest;
const {fromPartial: QueryGetMarketRequestFromPartial} = bze.tradebin.v1.QueryGetMarketRequest;

export async function getMarketBuyOrders(marketId: string): Promise<QueryMarketAggregatedOrdersResponseSDKType> {
    return getMarketOrders(marketId, ORDER_TYPE_BUY);
}

export async function getMarketSellOrders(marketId: string): Promise<QueryMarketAggregatedOrdersResponseSDKType> {
    return getMarketOrders(marketId, ORDER_TYPE_SELL);
}

export async function getMarketOrders(marketId: string, orderType: string): Promise<QueryMarketAggregatedOrdersResponseSDKType> {
    try {
        const reversed = orderType === ORDER_TYPE_BUY;
        const client = await getRestClient();
        return client.bze.tradebin.v1.marketAggregatedOrders(QueryMarketAggregatedOrdersRequestFromPartyal({
            market: marketId,
            orderType: orderType,
            pagination: {limit: 15, reverse: reversed}
        }));

    } catch (e) {
        console.error(e);

        return {list: []};
    }
}

export async function getMarketHistory(marketId: string): Promise<QueryMarketHistoryResponseSDKType> {
    try {
        const client = await getRestClient();

        return client.bze.tradebin.v1.marketHistory(QueryMarketHistoryRequestFromPartial({
            market: marketId,
            pagination: {limit: 50, reverse: true}
        }));
    } catch (e) {
        console.error(e);

        return {list: []};
    }
}


export async function getAllMarkets(): Promise<QueryAllMarketResponseSDKType> {
    try {
        const cacheKey = ALL_MARKETS_KEY;
        let localData = getFromCache(cacheKey);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {

                return parsed;
            }
        }

        const client = await getRestClient();
        let response = await client.bze.tradebin.v1.marketAll(QueryMarketsFromPartial({pagination: {limit: 500}}));

        setInCache(cacheKey, JSON.stringify(response), ALL_MARKETS_CACHE_TTL);

        return response;
    } catch (e) {
        console.error(e);

        return {market: []};
    }
}

export async function removeAllMarketsCache() {
    removeFromCache(ALL_MARKETS_KEY);
}

export async function getAddressMarketOrders(marketId: string, address: string): Promise<QueryUserMarketOrdersResponseSDKType> {
    try {
        const client = await getRestClient();

        return client.bze.tradebin.v1.userMarketOrders(QueryUserMarketOrdersRequestFromPartial({
            market: marketId,
            address: address,
            pagination: {limit: 100, reverse: true}
        }));
    } catch (e) {
        console.error(e);

        return {list: []};
    }
}

export async function getMarketOrder(marketId: string, orderType: string, orderId: string): Promise<QueryMarketOrderResponseSDKType> {
    try {
        const cacheKey = `${ALL_MARKETS_KEY}${marketId}:${orderType}:${orderId}`;
        let localData = getFromCache(cacheKey);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {

                return parsed;
            }
        }

        const client = await getRestClient();
        const response = await client.bze.tradebin.v1.marketOrder(QueryMarketOrderRequestFromPartial({
            market: marketId,
            orderType: orderType,
            orderId: orderId
        }));

        setInCache(cacheKey, JSON.stringify(response), ALL_MARKETS_CACHE_TTL);

        return response;
    } catch (e) {
        console.error(e);

        return {order: undefined};
    }
}

export async function getAssetMarkets(denom: string): Promise<QueryAssetMarketsResponseSDKType> {
    try {
        const cacheKey = `${ALL_MARKETS_KEY}${denom}`;
        let localData = getFromCache(cacheKey);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {
                return parsed;
            }
        }

        const client = await getRestClient();
        const response = await client.bze.tradebin.v1.assetMarkets(QueryAssetMarketsRequestFromPartial({asset: denom}));

        setInCache(cacheKey, JSON.stringify(response), CACHE_TTL_IN_SECONDS)

        return response;
    } catch (e) {
        console.error(e);

        return {base: [], quote: []};
    }
}

export async function getAssetsMarket(base: string, quote: string): Promise<QueryGetMarketResponseSDKType> {
    try {
        let cacheKey = `${ALL_MARKETS_KEY}${base}:${quote}`;
        let localData = getFromCache(cacheKey);
        // search for inversed denoms (base and quote) since the blockchhain allows one pair only no matter the order they are in
        // and it returns on the called endpoint the market regardless of the order you're giving the assets
        if (null === localData) {
            let cacheKey = `${ALL_MARKETS_KEY}${quote}:${base}`;
            localData = getFromCache(cacheKey);
        }

        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {
                return parsed;
            }
        }

        const client = await getRestClient();
        const response = await client.bze.tradebin.v1.market(QueryGetMarketRequestFromPartial({
            base: base,
            quote: quote
        }));

        //increase cache TTL since the market is not expected to be different
        setInCache(cacheKey, JSON.stringify(response), CACHE_TTL_IN_SECONDS);

        return response;
    } catch (e) {
        console.error(e);

        return {};
    }
}
