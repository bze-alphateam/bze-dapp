import {describe, expect, it} from "vitest";
import {hasMaxFillsRefund} from "../utils/OrderEvents";

const refund = (reason: string) => ({
    type: "bze.tradebin.OrderMessageRefundedEvent",
    attributes: [{key: "order_id", value: "\"1\""}, {key: "reason", value: reason}],
});

describe("hasMaxFillsRefund", () => {
    it("detects the refund event with a json quoted reason", () => {
        expect(hasMaxFillsRefund([{type: "transfer", attributes: []}, refund("\"max_fills_reached\"")])).toBe(true);
    });

    it("detects an unquoted reason", () => {
        expect(hasMaxFillsRefund([refund("max_fills_reached")])).toBe(true);
    });

    it("ignores other reasons, other events and missing events (v8.2.0)", () => {
        expect(hasMaxFillsRefund([refund("\"other\"")])).toBe(false);
        expect(hasMaxFillsRefund([{type: "message", attributes: [{key: "reason", value: "max_fills_reached"}]}])).toBe(false);
        expect(hasMaxFillsRefund(undefined)).toBe(false);
    });
});
