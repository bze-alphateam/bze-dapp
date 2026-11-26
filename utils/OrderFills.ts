import BigNumber from "bignumber.js";
import {toCanonicalInteger} from "./Amount";

// MsgFillOrders is refused by chain v8.3.0 with more than this many entries (or duplicate prices)
export const MAX_FILL_ORDERS = 50;

export interface FillEntry {
    price: string;
    amount: string;
}

export interface CappedFills<T extends FillEntry> {
    orders: T[];
    //true when price levels were left out because of the cap
    truncated: boolean;
}

// Merges entries with the same price, turns amounts into canonical integers and keeps only the
// first `max` price levels (callers pass them best price first).
export function capFillOrders<T extends FillEntry>(orders: T[], max: number = MAX_FILL_ORDERS): CappedFills<T> {
    const merged: T[] = [];
    const indexByPrice = new Map<string, number>();
    for (const order of orders) {
        const key = new BigNumber(order.price).toString();
        const existing = indexByPrice.get(key);
        if (existing === undefined) {
            indexByPrice.set(key, merged.length);
            merged.push({...order, amount: toCanonicalInteger(order.amount)});
            continue;
        }

        merged[existing] = {
            ...merged[existing],
            amount: toCanonicalInteger(new BigNumber(merged[existing].amount).plus(order.amount)),
        };
    }

    return {orders: merged.slice(0, max), truncated: merged.length > max};
}
