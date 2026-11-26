import {describe, expect, it, vi} from "vitest";
import {fetchDenomAuthority, resolveDenomAuthority} from "../utils/Mintable";

describe("resolveDenomAuthority", () => {
    it("uses the explicit flag when present", () => {
        expect(resolveDenomAuthority({admin: "bze1a", mintable: false})).toEqual({admin: "bze1a", mintable: false});
        expect(resolveDenomAuthority({admin: "", mintable: true})).toEqual({admin: "", mintable: true});
    });

    it("falls back to admin != '' on v8.2.0 nodes that omit it", () => {
        expect(resolveDenomAuthority({admin: "bze1a"})).toEqual({admin: "bze1a", mintable: true});
        expect(resolveDenomAuthority({admin: ""})).toEqual({admin: "", mintable: false});
        expect(resolveDenomAuthority(undefined)).toEqual({admin: "", mintable: false});
    });

    it("ignores non boolean flags", () => {
        expect(resolveDenomAuthority({admin: "bze1a", mintable: "false"})).toEqual({admin: "bze1a", mintable: true});
    });
});

describe("fetchDenomAuthority", () => {
    it("queries the rest route with the encoded denom", async () => {
        const fetcher = vi.fn().mockResolvedValue({denomAuthority: {admin: "bze1a", mintable: false}});
        const res = await fetchDenomAuthority(fetcher, "https://rest.example/", "factory/bze1a/x y");
        expect(fetcher).toHaveBeenCalledWith("https://rest.example/bze/tokenfactory/denom_authority?denom=factory%2Fbze1a%2Fx%20y");
        expect(res).toEqual({admin: "bze1a", mintable: false});
    });

    it("returns undefined (unknown) instead of 'no admin' when the request fails", async () => {
        const fetcher = vi.fn().mockRejectedValue(new Error("down"));
        expect(await fetchDenomAuthority(fetcher, "https://r", "ubze")).toBeUndefined();
    });
});
