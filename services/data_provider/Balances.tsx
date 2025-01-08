import {QuerySpendableBalancesResponseSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/query";
import {getCounterpartyRestClient, getRestClient} from "../Client";
import {getFromCache, removeFromCache, setInCache} from "@/services/data_provider/cache";
import {MetadataSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import {IbcTransition} from "@chain-registry/types/assetlist.schema";
import {CoinSDKType} from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";
import {isNativeType} from "@/services";
import {MAINNET_OSMOSIS_IBC_DENOM, MAINNET_UDENOM} from "@/utils";

const BALANCES_KEY = 'bank:balances:';

const BALANCES_CACHE_TTL = 60 * 5; //15 minutes

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
// with our IBC denom. This is helpful when wanting to display the balance of an IBC denom on our chain on the original chain
// if provided token is ubze (mainnet!!) it returns the balance on osmosis
export async function getAddressCounterpartyBalances(address: string, token: CounterpartyToken): Promise<CoinSDKType[]> {
    let counterpartyChainName = ""
    let base = "";
    if (token.metadata.base === MAINNET_UDENOM) {
        counterpartyChainName = "osmosis";
        base = MAINNET_OSMOSIS_IBC_DENOM;
    } else {
        if (!token || !token.ibcTrace || token.ibcTrace.type !== "ibc" || !token.ibcTrace.counterparty) {
            return [];
        }
        counterpartyChainName = token.ibcTrace.counterparty.chain_name;
        base = token.ibcTrace.counterparty.base_denom;
    }

    try {
        const client = await getCounterpartyRestClient(counterpartyChainName);
        let response = await client.cosmos.bank.v1beta1.spendableBalances({address: address});

        if (!response) {
            return [];
        }

        //already checked that token.ibcTrace is not undefined
        //@ts-ignore
        const found = response.balances.find((item) => item.denom === base);
        if (!found) {
            return [];
        }

        return [
            {
                denom: token.metadata.base === MAINNET_UDENOM ? MAINNET_UDENOM : token.metadata.base,
                amount: found.amount,
            }
        ];
    } catch (e) {
        console.error(e);

        return [];
    }
}
