
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
        console.error("failed to fetch tickrs", e);
        return new Map();
    }
}
