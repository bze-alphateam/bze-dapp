import { QuerySpendableBalancesResponseSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/query";
import { getRestClient } from "../Client";

const BALANCES_KEY = 'bank:balances:';

const BALANCES_CACHE_TTL = 1000 * 60 * 15; //15 minutes

export async function getAddressBalances(address: string): Promise<QuerySpendableBalancesResponseSDKType> {
  try {
    const cacheKey = `${BALANCES_KEY}${address}`;
    let localData = localStorage.getItem(cacheKey);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {
                
                return new Promise<QuerySpendableBalancesResponseSDKType> ((resolve) => {
                    resolve({...parsed.params});
                })
            }
        }
    }

    const client = await getRestClient();
    let response = await client.cosmos.bank.v1beta1.spendableBalances({address: address});
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + BALANCES_CACHE_TTL,
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return new Promise<QuerySpendableBalancesResponseSDKType> ((resolve) => {
        resolve(response);
    })
  } catch(e) {
    console.error(e);

    return {balances: []};
  }
}