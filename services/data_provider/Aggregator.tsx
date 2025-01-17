export interface TradeViewChart {
    "time": string;
    "low": number;
    "open": number;
    "high": number;
    "close": number;
    "value": number; //volume of the interval
}

export interface HistoryOrder {
    "order_id": number;
    "price": string | number;
    "base_volume": string | number;
    "quote_volume": string | number;
    "executed_at": string;
    "order_type": string;
    "maker": string;
    "taker": string;
}

export interface Ticker {
    base: string;
    quote: string;
    market_id: string;
    last_price: number;
    base_volume: number;
    quote_volume: number;
    bid: number;
    ask: number;
    high: number;
    low: number;
    open_price: number;
    change: number;
}

const getHost = (): string => {
    return process.env.NEXT_PUBLIC_AGG_API_HOST ?? "";
}

const getAllTickersUrl = (): string => {
    return `${getHost()}/api/dex/tickers`;
}

const getAddressHistoryUrl = (): string => {
    return `${getHost()}/api/dex/history`;
}

export async function getAllTickers(): Promise<Map<string, Ticker>> {
    try {
        const resp = await fetch(getAllTickersUrl());
        const tickers = new Map();
        if (resp.status !== 200) {
            return tickers;
        }

        const decodedResp = await resp.json();
        for (let i = 0; i < decodedResp.length; i++) {
            tickers.set(decodedResp[i].market_id, decodedResp[i]);
        }

        return tickers;
    } catch (e) {
        console.error("failed to fetch tickers", e);
        return new Map();
    }
}

export async function getAddressHistory(address: string, market: string): Promise<HistoryOrder[]> {
    try {
        const url = `${getAddressHistoryUrl()}?address=${address}&market_id=${market}&limit=100`;
        const resp = await fetch(url);
        if (resp.status !== 200) {
            return [];
        }

        return await resp.json();
    } catch (e) {
        console.error("failed to fetch address orders", e);
        return [];
    }
}

export async function getTradingViewIntervals(market: string, minutes: number, limit: number): Promise<TradeViewChart[]> {
    try {
        const url = `${getHost()}/api/dex/intervals?market_id=${market}&minutes=${minutes}&limit=${limit}&format=tv`;
        const resp = await fetch(url);
        if (resp.status !== 200) {
            return [];
        }

        const jsonResponse =  await resp.json();
        if (!jsonResponse) {
            return [];
        }

        return jsonResponse;
    } catch (e) {
        console.error("failed to fetch trading view intervals", e);
        return [];
    }
}
