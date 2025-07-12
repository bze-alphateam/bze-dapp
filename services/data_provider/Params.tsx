import {getRestClient} from "../Client";
import {ParamsSDKType as QueryParamsResponseSDKType} from "@bze/bzejs/bze/tradebin/params";
import {ParamsSDKType as TFParams} from "@bze/bzejs/bze/tokenfactory/params";
import {ParamsSDKType as RewardsParams} from "@bze/bzejs/bze/rewards/params";
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
    let response = await client.bze.tradebin.params();

    setInCache(TRADEBIN_KEY, JSON.stringify(response.params), LOCAL_CACHE_TTL);

    return response.params
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
    let response = await client.bze.tokenfactory.params();

    setInCache(FACTORY_KEY, JSON.stringify(response.params), LOCAL_CACHE_TTL);

    return response.params;
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
    let response = await client.bze.rewards.params();

    setInCache(REWARDS_KEY, JSON.stringify(response.params), LOCAL_CACHE_TTL);

    return response.params;
}
