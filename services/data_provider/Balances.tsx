import {QuerySpendableBalancesResponseSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/query";
import {getRestClient} from "../Client";
import {getFromCache, removeFromCache, setInCache} from "@/services/data_provider/cache";

const BALANCES_KEY = 'bank:balances:';

const BALANCES_CACHE_TTL = 60 * 15; //15 minutes

export async function getAddressBalances(address: string): Promise<QuerySpendableBalancesResponseSDKType> {
    try {
        const cacheKey = `${BALANCES_KEY}${address}`;
        let localData = getFromCache(cacheKey);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {
                return parsed;
            }
        }

        const client = await getRestClient();
        let response = await client.cosmos.bank.v1beta1.spendableBalances({address: address});

        setInCache(cacheKey, JSON.stringify(response), BALANCES_CACHE_TTL);

        return response;
    } catch (e) {
        console.error(e);

        return {balances: []};
    }
}

export async function removeBalancesCache(address: string) {
    const cacheKey = `${BALANCES_KEY}${address}`;
    removeFromCache(cacheKey);
}
