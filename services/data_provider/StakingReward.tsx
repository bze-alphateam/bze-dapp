import { QueryAllStakingRewardResponseSDKType, QueryGetStakingRewardParticipantResponseSDKType } from "@bze/bzejs/types/codegen/beezee/rewards/query";
import { getRestClient } from "../Client";
import { bze } from '@bze/bzejs';
import { StakingRewardSDKType } from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward";
import { StakingRewardParticipantSDKType } from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward_participant";

const SR_KEY = 'SR:LIST';
const SRP_KEY = 'SRP:LIST:';
const ADDR_SR_KEY = 'SR_ADDR';
const SR_TTL = 1000 * 60 * 10; //10 minutes

const { fromPartial: QueryAllStakingRewardRequestFromPartial } = bze.v1.rewards.QueryAllStakingRewardRequest;
const { fromPartial: QueryGetStakingRewardParticipantRequestFromPartial } = bze.v1.rewards.QueryGetStakingRewardParticipantRequest;

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
    let response = await client.bze.v1.rewards.stakingRewardAll(QueryAllStakingRewardRequestFromPartial({pagination: {reverse: reverse, limit: 1000}}));
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

export async function resetStakingRewardsCache(address?: string): Promise<void> {
  localStorage.removeItem(SR_KEY);
  if (address !== undefined) {
    localStorage.removeItem(getStakingRewardParticipantCacheKey(address));
    localStorage.removeItem(getStakingRewardsByAddressCacheKey(address));
  }
}

function getStakingRewardParticipantCacheKey(address: string): string {
  return `${SRP_KEY}${address}`
}

function getStakingRewardsByAddressCacheKey(address: string): string {
  return `${ADDR_SR_KEY}${address}`
}

export async function getStakingRewardParticipantByAddress(address: string): Promise<QueryGetStakingRewardParticipantResponseSDKType> {
  try {
    const cacheKey = getStakingRewardParticipantCacheKey(address);
    let localData = localStorage.getItem(cacheKey);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
      if (parsed) {
        if (parsed.expiresAt > new Date().getTime()) {

          return new Promise<QueryGetStakingRewardParticipantResponseSDKType> ((resolve) => {
              resolve({...parsed.params});
          })
        }
      }
    }

    const client = await getRestClient();
    let response = await client.bze.v1.rewards.stakingRewardParticipant(QueryGetStakingRewardParticipantRequestFromPartial({address: address, pagination: {limit: 100}}));
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + SR_TTL,
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return new Promise<QueryGetStakingRewardParticipantResponseSDKType> ((resolve) => {
        resolve(response);
    })
  } catch(e) {
    console.error(e);

    return {list: []};
  }
}

export interface AddressStakingRewards {
  rewards: StakingRewardSDKType[];
  participation: Map<string, StakingRewardParticipantSDKType>;
}

export async function getAddressStakingRewards(address: string): Promise<AddressStakingRewards> {
  try {
    const rewards: StakingRewardSDKType[] = [];
    const participation: Map<string, StakingRewardParticipantSDKType> = new Map();

    const participantRewards = await getStakingRewardParticipantByAddress(address);
    if (participantRewards.list.length === 0) {
      let empty = {
        rewards: rewards,
        participation: participation,
      }

      return empty;
    }

    const allRewards = await getStakingRewards();
    for (let i = 0; i < participantRewards.list.length; i++) {
      let part = participantRewards.list[i];
      let rew = allRewards.list.find((rew: StakingRewardSDKType) => rew.reward_id === part.reward_id);
      if (rew === undefined) {
        continue;
      }
      rewards.push(rew);
      participation.set(rew.reward_id, part);
    }

    return new Promise<AddressStakingRewards> ((resolve) => {
      resolve({
        rewards: rewards,
        participation: participation,
      });
    })
  } catch(e) {
    console.error(e);

    return  {
      rewards: [],
      participation: new Map(),
    }
  }
}

