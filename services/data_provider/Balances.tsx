
import {getCounterpartyRestClient, getRestClient} from "../Client";
import {getFromCache, removeFromCache, setInCache} from "@/services/data_provider/cache";

import {IbcTransition} from "@chain-registry/types/assetlist.schema";
import {CoinSDKType} from "interchain-query/cosmos/base/v1beta1/coin";
import {QuerySpendableBalancesResponseSDKType} from "interchain-query/cosmos/bank/v1beta1/query";
import {MetadataSDKType} from "interchain-query/cosmos/bank/v1beta1/bank";

const BALANCES_KEY = 'bank:balances:';

const BALANCES_CACHE_TTL = 30;

export interface CounterpartyToken {
    metadata: MetadataSDKType,
    ibcTrace?: IbcTransition,
}

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

// fetches the balances from token counterparty chain and builds an array of CoinSDKType by replacing the original denom
// with our chain (ibc, native) denom.
export async function getAddressCounterpartyBalances(address: string, token: CounterpartyToken): Promise<CoinSDKType[]> {
    if (!token || !token.ibcTrace || token.ibcTrace.type !== "ibc" || !token.ibcTrace.counterparty) {
        return [];
    }
    const counterpartyChainName = token.ibcTrace.counterparty.chain_name;
    const counterpartyBase = token.ibcTrace.counterparty.base_denom;

    try {
        const client = await getCounterpartyRestClient(counterpartyChainName);
        let response = await client.cosmos.bank.v1beta1.spendableBalances({address: address});

        if (!response) {
            return [];
        }

        //already checked that token.ibcTrace is not undefined
        //@ts-ignore
        const found = response.balances.find((item) => item.denom === counterpartyBase);
        if (!found) {
            return [];
        }

        return [
            {
                denom: token.metadata.base,
                amount: found.amount,
            }
        ];
    } catch (e) {
        console.error(e);

        return [];
    }
}
