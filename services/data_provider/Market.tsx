import { QueryAllMarketResponseSDKType, QueryMarketAggregatedOrdersResponseSDKType, QueryMarketHistoryResponseSDKType } from "@bze/bzejs/types/codegen/beezee/tradebin/query";
import { getRestClient } from "../Client";
import { bze } from '@bze/bzejs';

const ALL_MARKETS_KEY = 'markets:list';
const ALL_MARKETS_CACHE_TTL = 1000 * 60 * 5; //5 minutes

const ORDER_TYPE_BUY = 'buy';
const ORDER_TYPE_SELL = 'sell';

const { fromPartial: QueryMarketsFromPartial } = bze.tradebin.v1.QueryAllMarketRequest;
const { fromPartial: QueryMarketAggregatedOrdersRequestFromPartyal } = bze.tradebin.v1.QueryMarketAggregatedOrdersRequest;
const { fromPartial: QueryMarketHistoryRequestFromPartial } = bze.tradebin.v1.QueryMarketHistoryRequest;

export async function getMarketBuyOrders(marketId: string): Promise<QueryMarketAggregatedOrdersResponseSDKType> {
  return getMarketOrders(marketId, ORDER_TYPE_BUY);
}

export async function getMarketSellOrders(marketId: string): Promise<QueryMarketAggregatedOrdersResponseSDKType> {
  return getMarketOrders(marketId, ORDER_TYPE_SELL);
}

export async function getMarketOrders(marketId: string, orderType: string): Promise<QueryMarketAggregatedOrdersResponseSDKType> {
  try {
    const client = await getRestClient();
    return client.bze.tradebin.v1.marketAggregatedOrders(QueryMarketAggregatedOrdersRequestFromPartyal({market: marketId, orderType: orderType, pagination: {limit: 20, reverse: true}}));

  } catch(e) {
    console.error(e);

    return {list: []};
  }
}

export async function getMarketHistory(marketId: string): Promise<QueryMarketHistoryResponseSDKType> {
  try {
    const client = await getRestClient();
    
    return client.bze.tradebin.v1.marketHistory(QueryMarketHistoryRequestFromPartial({market: marketId, pagination: {limit: 50, reverse: true}}));
  } catch(e) {
    console.error(e);

    return {list: []};
  }
}


export async function getAllMarkets(): Promise<QueryAllMarketResponseSDKType> {
  try {
    const cacheKey = ALL_MARKETS_KEY;
    let localData = localStorage.getItem(cacheKey);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {
                
                return new Promise<QueryAllMarketResponseSDKType> ((resolve) => {
                    resolve({...parsed.params});
                })
            }
        }
    }

    const client = await getRestClient();
    let response = await client.bze.tradebin.v1.marketAll(QueryMarketsFromPartial({pagination: {limit: 500}}));
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + ALL_MARKETS_CACHE_TTL,
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return new Promise<QueryAllMarketResponseSDKType> ((resolve) => {
        resolve(response);
    })
  } catch(e) {
    console.error(e);

    return {market: []};
  }
}

export async function removeAllMarketsCache() {
  localStorage.removeItem(ALL_MARKETS_KEY);
}
