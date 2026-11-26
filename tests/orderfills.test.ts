import {describe, expect, it} from "vitest";
import {capFillOrders, MAX_FILL_ORDERS} from "../utils/OrderFills";

const level = (i: number) => ({price: `${i}.5`, amount: "10", order_type: "sell"});

describe("capFillOrders", () => {
    it("keeps the best 50 price levels and flags truncation", () => {
        const orders = Array.from({length: 70}, (_, i) => level(i + 1));
        const res = capFillOrders(orders);
        expect(res.orders).toHaveLength(MAX_FILL_ORDERS);
        expect(res.orders[0].price).toBe("1.5");
        expect(res.orders[49].price).toBe("50.5");
        expect(res.truncated).toBe(true);
    });

    it("does not flag exactly 50", () => {
        const res = capFillOrders(Array.from({length: 50}, (_, i) => level(i + 1)));
        expect(res.orders).toHaveLength(50);
        expect(res.truncated).toBe(false);
    });

    it("merges duplicate prices", () => {
        const res = capFillOrders([
            {price: "1.50", amount: "5"},
            {price: "1.5", amount: "7"},
            {price: "2", amount: "1"},
        ]);
        expect(res.orders).toEqual([{price: "1.50", amount: "12"}, {price: "2", amount: "1"}]);
    });

    it("turns amounts into canonical integers", () => {
        const res = capFillOrders([{price: "1", amount: "1e21"}, {price: "2", amount: "3.7"}]);
        expect(res.orders.map((o) => o.amount)).toEqual(["1000000000000000000000", "3"]);
    });
});
