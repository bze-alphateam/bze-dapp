import {describe, expect, it} from "vitest";
import {prettyError} from "../utils/Errors";

describe("prettyError", () => {
    it("keeps the min stake message working with the sdk prefix", () => {
        expect(prettyError("failed to execute message; message index: 0: amount is smaller than staking reward min stake"))
            .toBe("Amount is smaller than minimum required stake");
    });

    it.each([
        ["failed to execute message; message index: 0: transfer exceeds quota: 12", "limit"],
        ["denom ibc/ABC is blacklisted: tx rejected", "stopped"],
        ["circuit breaker disables execution of this message: /bze.x.MsgY", "paused"],
        ["rpc error: minting is disabled for this denom", "Minting is turned off"],
        ["order not found: 12", "no longer exists"],
        ["0ubze is smaller than 5ubze: insufficient funds", "enough balance"],
    ])("maps %s", (raw, expected) => {
        expect(prettyError(raw)).toContain(expected);
    });

    it("returns unknown errors untouched and undefined for empty", () => {
        expect(prettyError("something else")).toBe("something else");
        expect(prettyError(undefined)).toBeUndefined();
    });
});
