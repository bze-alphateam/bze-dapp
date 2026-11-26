export interface DenomAuthority {
    admin: string;
    mintable: boolean;
}

type RawAuthority = { admin?: string; mintable?: unknown } | undefined | null;

// v8.3.0 nodes return an explicit `mintable` flag; v8.2.0 nodes omit it, there a token is
// mintable exactly while it has an admin.
export function resolveDenomAuthority(raw: RawAuthority): DenomAuthority {
    const admin = raw?.admin ?? "";

    return {
        admin,
        mintable: typeof raw?.mintable === "boolean" ? raw.mintable : admin !== "",
    };
}

export type JsonFetcher = (url: string) => Promise<any>;

// bzejs 1.9 does not decode `mintable`, so the authority is read as plain JSON.
// Resolves to undefined when the authority could not be read: callers must treat that as
// "unknown" and never as "no admin".
export async function fetchDenomAuthority(fetchJson: JsonFetcher, restUrl: string, denom: string): Promise<DenomAuthority | undefined> {
    try {
        const base = restUrl.replace(/\/+$/, "");
        const res = await fetchJson(`${base}/bze/tokenfactory/denom_authority?denom=${encodeURIComponent(denom)}`);

        return resolveDenomAuthority(res?.denomAuthority ?? res?.denom_authority);
    } catch (e) {
        console.error(e);

        return undefined;
    }
}
