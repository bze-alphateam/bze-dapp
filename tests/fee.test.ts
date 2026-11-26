import {describe, expect, it, vi} from "vitest";
import {simulateFee} from "../utils/Fee";

describe("simulateFee", () => {
    it("builds the fee from the simulated gas x1.5", async () => {
        const simulator = {simulate: vi.fn().mockResolvedValue(100000)};
        const fee = await simulateFee("bze1a", simulator, [], "ubze");
        expect(fee).toEqual({amount: [{denom: "ubze", amount: "15000"}], gas: "150000"});
    });

    it("uses the fee token price", async () => {
        const simulator = {simulate: vi.fn().mockResolvedValue(1000)};
        const fee = await simulateFee("bze1a", simulator, [], "ubze", undefined, {denom: "utest", average_gas_price: 2});
        expect(fee.amount).toEqual([{denom: "utest", amount: "3000"}]);
    });

    it("rejects when the simulation fails instead of returning a fixed fee", async () => {
        const simulator = {simulate: vi.fn().mockRejectedValue(new Error("transfer exceeds quota"))};
        await expect(simulateFee("bze1a", simulator, [], "ubze")).rejects.toThrow("exceeds quota");
    });
});
