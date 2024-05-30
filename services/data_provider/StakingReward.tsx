import { QueryAllStakingRewardResponseSDKType } from "@bze/bzejs/types/codegen/beezee/rewards/query";
import { getRestClient } from "../Client";
import { bze } from '@bze/bzejs';

const SR_KEY = 'SR:LIST';
const SR_TTL = 1000 * 60 * 10; //10 minutes

const { fromPartial: QueryAllStakingRewardRequestFromPartial } = bze.v1.rewards.QueryAllStakingRewardRequest;

export async function getStakingRewards(reverse: boolean = true): Promise<QueryAllStakingRewardResponseSDKType> {
  try {
    let localData = localStorage.getItem(SR_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {
                
                return new Promise<QueryAllStakingRewardResponseSDKType> ((resolve) => {
                    resolve({...parsed.params});
                })
            }
        }
    }

    const client = await getRestClient();
    let response = await client.bze.v1.rewards.stakingRewardAll(QueryAllStakingRewardRequestFromPartial({pagination: {reverse: reverse}}));
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + SR_TTL,
    }
    localStorage.setItem(SR_KEY, JSON.stringify(cacheData));

    return new Promise<QueryAllStakingRewardResponseSDKType> ((resolve) => {
        resolve(response);
    })
  } catch(e) {
    console.error(e);

    return {list: []};
  }
}

export async function resetStakingRewardsCache(): Promise<void> {
  localStorage.removeItem(SR_KEY);
}
