import {getRestClient} from "../Client";
import {QueryParamsResponseSDKType} from "@bze/bzejs/types/codegen/beezee/tradebin/query";
import {QueryParamsResponseSDKType as TFParams} from "@bze/bzejs/types/codegen/beezee/tokenfactory/query";
import {QueryParamsResponseSDKType as RewardsParams} from "@bze/bzejs/types/codegen/beezee/rewards/query";

const TRADEBIN_KEY = 'params:tradebin';
const FACTORY_KEY = 'params:token_factory';
const REWARDS_KEY = 'params:rewards';

const LOCAL_CACHE_TTL = 1000 * 60 * 60 * 4; //4 hours

export async function getTradebinParams(): Promise<QueryParamsResponseSDKType> {
    let localData = localStorage.getItem(TRADEBIN_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {

                return new Promise<QueryParamsResponseSDKType>((resolve) => {
                    resolve({...parsed.params});
                })
            }
        }
    }

    const client = await getRestClient();
    let response = await client.bze.tradebin.v1.params();
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + LOCAL_CACHE_TTL,
    }
    localStorage.setItem(TRADEBIN_KEY, JSON.stringify(cacheData));

    return new Promise<QueryParamsResponseSDKType>((resolve) => {
        resolve(response);
    })
}

export async function getTokenFactoryParams(): Promise<TFParams> {
    let localData = localStorage.getItem(FACTORY_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {

                return new Promise<TFParams>((resolve) => {
                    resolve({...parsed.params});
                })
            }
        }
    }

    const client = await getRestClient();
    let response = await client.bze.tokenfactory.v1.params();
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + LOCAL_CACHE_TTL,
    }
    localStorage.setItem(FACTORY_KEY, JSON.stringify(cacheData));

    return new Promise<TFParams>((resolve) => {
        resolve(response);
    })
}

export async function getRewardsParams(): Promise<RewardsParams> {
    let localData = localStorage.getItem(REWARDS_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {

                return new Promise<RewardsParams>((resolve) => {
                    resolve({...parsed.params});
                })
            }
        }
    }

    const client = await getRestClient();
    let response = await client.bze.v1.rewards.params();
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + LOCAL_CACHE_TTL,
    }
    localStorage.setItem(REWARDS_KEY, JSON.stringify(cacheData));

    return new Promise<RewardsParams>((resolve) => {
        resolve(response);
    })
}
