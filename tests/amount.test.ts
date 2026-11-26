import {describe, expect, it} from "vitest";
import BigNumber from "bignumber.js";
import {amountToBigNumberUAmount, amountToUAmount, toCanonicalInteger} from "../utils/Amount";

describe("canonical integer amounts", () => {
    it("cuts decimals beyond the exponent instead of keeping them", () => {
        expect(amountToUAmount("1.1234567", 6)).toBe("1123456");
        expect(amountToUAmount("0.0000019", 6)).toBe("1");
        expect(amountToBigNumberUAmount("1.5", 0).toString()).toBe("1");
    });

    it("never uses exponent notation", () => {
        expect(amountToUAmount("1000000000000000", 18)).toBe("1000000000000000000000000000000000");
        expect(toCanonicalInteger(new BigNumber("1e25"))).toBe("10000000000000000000000000");
    });

    it("handles invalid input", () => {
        expect(toCanonicalInteger("abc")).toBe("0");
        expect(toCanonicalInteger("12.9")).toBe("12");
    });
});
