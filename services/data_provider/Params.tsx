import {getRestClient} from "../Client";
import {QueryParamsResponseSDKType} from "@bze/bzejs/types/codegen/beezee/tradebin/query";
import {QueryParamsResponseSDKType as TFParams} from "@bze/bzejs/types/codegen/beezee/tokenfactory/query";
import {QueryParamsResponseSDKType as RewardsParams} from "@bze/bzejs/types/codegen/beezee/rewards/query";
import {getFromCache, setInCache} from "@/services/data_provider/cache";

const TRADEBIN_KEY = 'params:tradebin';
const FACTORY_KEY = 'params:token_factory';
const REWARDS_KEY = 'params:rewards';

const LOCAL_CACHE_TTL = 60 * 60 * 4; //4 hours

export async function getTradebinParams(): Promise<QueryParamsResponseSDKType> {
    let localData = getFromCache(TRADEBIN_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {

            return parsed;
        }
    }

    const client = await getRestClient();
    let response = await client.bze.tradebin.v1.params();

    setInCache(TRADEBIN_KEY, JSON.stringify(response), LOCAL_CACHE_TTL);

    return response
}

export async function getTokenFactoryParams(): Promise<TFParams> {
    let localData = getFromCache(FACTORY_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {

            return parsed;
        }
    }

    const client = await getRestClient();
    let response = await client.bze.tokenfactory.v1.params();

    setInCache(FACTORY_KEY, JSON.stringify(response), LOCAL_CACHE_TTL);

    return response;
}

export async function getRewardsParams(): Promise<RewardsParams> {
    let localData = getFromCache(REWARDS_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {

            return parsed;
        }
    }

    const client = await getRestClient();
    let response = await client.bze.v1.rewards.params();

    setInCache(REWARDS_KEY, JSON.stringify(response), LOCAL_CACHE_TTL);

    return response;
}
