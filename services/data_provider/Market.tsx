import { QueryAllMarketResponseSDKType, QueryMarketAggregatedOrdersResponseSDKType, QueryMarketHistoryResponseSDKType, QueryMarketOrderResponseSDKType, QueryUserMarketOrdersResponseSDKType } from "@bze/bzejs/types/codegen/beezee/tradebin/query";
import { getRestClient } from "../Client";
import { bze } from '@bze/bzejs';

const ALL_MARKETS_KEY = 'markets:list';
const ALL_MARKETS_CACHE_TTL = 1000 * 60 * 5; //5 minutes

const ORDER_TYPE_BUY = 'buy';
const ORDER_TYPE_SELL = 'sell';

const { fromPartial: QueryMarketsFromPartial } = bze.tradebin.v1.QueryAllMarketRequest;
const { fromPartial: QueryMarketAggregatedOrdersRequestFromPartyal } = bze.tradebin.v1.QueryMarketAggregatedOrdersRequest;
const { fromPartial: QueryMarketHistoryRequestFromPartial } = bze.tradebin.v1.QueryMarketHistoryRequest;
const { fromPartial: QueryUserMarketOrdersRequestFromPartial } = bze.tradebin.v1.QueryUserMarketOrdersRequest;
const { fromPartial: QueryMarketOrderRequestFromPartial } = bze.tradebin.v1.QueryMarketOrderRequest;

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
    return client.bze.tradebin.v1.marketAggregatedOrders(QueryMarketAggregatedOrdersRequestFromPartyal({market: marketId, orderType: orderType, pagination: {limit: 15, reverse: reversed}}));

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

export async function getAddressMarketOrders(marketId: string, address: string): Promise<QueryUserMarketOrdersResponseSDKType> {
  try {
    const client = await getRestClient();
    
    return client.bze.tradebin.v1.userMarketOrders(QueryUserMarketOrdersRequestFromPartial({market: marketId, address: address, pagination: {limit: 100, reverse: true}}));
  } catch(e) {
    console.error(e);

    return {list: []};
  }
}

export async function getMarketOrder(marketId: string, orderType: string, orderId: string): Promise<QueryMarketOrderResponseSDKType> {
  try {
    const cacheKey = `${ALL_MARKETS_KEY}${marketId}:${orderType}:${orderId}`;
    let localData = localStorage.getItem(cacheKey);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {
                
                return new Promise<QueryMarketOrderResponseSDKType> ((resolve) => {
                    resolve({...parsed.params});
                })
            }
        }
    }

    const client = await getRestClient();
    const response = await client.bze.tradebin.v1.marketOrder(QueryMarketOrderRequestFromPartial({market: marketId, orderType: orderType, orderId: orderId}));
    let cacheData = {
      params: {...response},
      expiresAt: new Date().getTime() + ALL_MARKETS_CACHE_TTL,
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    return response;
  } catch(e) {
    console.error(e);

    return {order: undefined};
  }
}
