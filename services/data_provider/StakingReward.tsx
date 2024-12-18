import {
    QueryAllPendingUnlockParticipantResponseSDKType,
    QueryAllStakingRewardResponseSDKType,
    QueryGetStakingRewardParticipantResponseSDKType
} from "@bze/bzejs/types/codegen/beezee/rewards/query";
import {getRestClient} from "../Client";
import {bze} from '@bze/bzejs';
import {StakingRewardSDKType} from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward";
import {StakingRewardParticipantSDKType} from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward_participant";
import {getFromCache, setInCache} from "@/services/data_provider/cache";
import {PendingUnlockParticipantSDKType} from "@bze/bzejs/src/codegen/beezee/rewards/staking_reward_participant";

const SR_KEY = 'SR:LIST';
const SRP_KEY = 'SRP:LIST:';
const SRU_KEY = 'SRU:LIST:';
const ADDR_SR_KEY = 'SR_ADDR';
const SR_TTL = 1000 * 60 * 5; //10 minutes

const {fromPartial: QueryAllStakingRewardRequestFromPartial} = bze.v1.rewards.QueryAllStakingRewardRequest;
const {fromPartial: QueryGetStakingRewardParticipantRequestFromPartial} = bze.v1.rewards.QueryGetStakingRewardParticipantRequest;
const {fromPartial: QueryAllPendingUnlockParticipantRequestFromPartial} = bze.v1.rewards.QueryAllPendingUnlockParticipantRequest;

export async function getStakingRewards(reverse: boolean = true): Promise<QueryAllStakingRewardResponseSDKType> {
    try {
        let localData = getFromCache(SR_KEY);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {

                return parsed;
            }
        }

        const client = await getRestClient();
        let response = await client.bze.v1.rewards.stakingRewardAll(QueryAllStakingRewardRequestFromPartial({
            pagination: {
                reverse: reverse,
                limit: 1000
            }
        }));
        setInCache(SR_KEY, JSON.stringify(response), SR_TTL);

        return response
    } catch (e) {
        console.error(e);

        return {list: []};
    }
}

export async function resetStakingRewardsCache(address?: string): Promise<void> {
    localStorage.removeItem(SR_KEY);
    if (address !== undefined) {
        localStorage.removeItem(getStakingRewardParticipantCacheKey(address));
        localStorage.removeItem(getStakingRewardsByAddressCacheKey(address));
        localStorage.removeItem(getPendingUnlockCacheKey());
    }
}

function getStakingRewardParticipantCacheKey(address: string): string {
    return `${SRP_KEY}${address}`
}

function getStakingRewardsByAddressCacheKey(address: string): string {
    return `${ADDR_SR_KEY}${address}`
}

function getPendingUnlockCacheKey(): string {
    return SRU_KEY
}

export async function getStakingRewardParticipantByAddress(address: string): Promise<QueryGetStakingRewardParticipantResponseSDKType> {
    try {
        const cacheKey = getStakingRewardParticipantCacheKey(address);
        let localData = getFromCache(cacheKey);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {
                return parsed;
            }
        }

        const client = await getRestClient();
        let response = await client.bze.v1.rewards.stakingRewardParticipant(QueryGetStakingRewardParticipantRequestFromPartial({
            address: address,
            pagination: {limit: 100}
        }));
        setInCache(cacheKey, JSON.stringify(response), SR_TTL);

        return response;
    } catch (e) {
        console.error(e);

        return {list: []};
    }
}

export async function getAddressPendingUnlock(address: string): Promise<PendingUnlockParticipantSDKType[]> {
    const all = await getPendingUnlockParticipants();
    if (!all || all.list.length === 0) {
        return [];
    }

    return all.list.filter((item) => item.address === address);
}

export async function getPendingUnlockParticipants(): Promise<QueryAllPendingUnlockParticipantResponseSDKType> {
    try {
        const cacheKey = getPendingUnlockCacheKey();
        let localData = getFromCache(cacheKey);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {
                return parsed;
            }
        }

        const client = await getRestClient();
        let response = await client.bze.v1.rewards.allPendingUnlockParticipant(QueryAllPendingUnlockParticipantRequestFromPartial({
            pagination: {limit: 1000}
        }));
        setInCache(cacheKey, JSON.stringify(response), SR_TTL);

        return response;
    } catch (e) {
        console.error(e);

        return {list: []};
    }
}

export interface AddressStakingRewards {
    rewards: StakingRewardSDKType[];
    participation: Map<string, StakingRewardParticipantSDKType>;
    unlocking: PendingUnlockParticipantSDKType[];
}

export async function getAddressStakingRewards(address: string): Promise<AddressStakingRewards> {
    try {
        const rewards: StakingRewardSDKType[] = [];
        const participation: Map<string, StakingRewardParticipantSDKType> = new Map();

        const [participantRewards, pending] = await Promise.all([getStakingRewardParticipantByAddress(address), getAddressPendingUnlock(address)]);
        if (participantRewards.list.length === 0) {
            return {
                rewards: rewards,
                participation: participation,
                unlocking: pending,
            }
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

        return new Promise<AddressStakingRewards>((resolve) => {
            resolve({
                rewards: rewards,
                participation: participation,
                unlocking: pending,
            });
        })
    } catch (e) {
        console.error(e);

        return {
            rewards: [],
            participation: new Map(),
            unlocking: [],
        }
    }
}

