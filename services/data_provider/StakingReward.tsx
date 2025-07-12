import {
    QueryAllPendingUnlockParticipantsResponseSDKType,
    QueryAllStakingRewardsResponseSDKType,
    QueryStakingRewardParticipantResponseSDKType
} from "@bze/bzejs/bze/rewards/query";
import {getRestClient} from "../Client";
import {bze} from '@bze/bzejs';
import {StakingRewardSDKType, StakingRewardParticipantSDKType, PendingUnlockParticipantSDKType} from "@bze/bzejs/bze/rewards/store";
import {getFromCache, removeFromCache, setInCache} from "@/services/data_provider/cache";

const SR_KEY = 'SR:LIST';
const SRP_KEY = 'SRP:LIST:';
const SRU_KEY = 'SRU:LIST:';
const ADDR_SR_KEY = 'SR_ADDR';
const SR_TTL = 60 * 5; //10 minutes

const {fromPartial: QueryAllStakingRewardRequestFromPartial} = bze.rewards.QueryAllStakingRewardsRequest;
const {fromPartial: QueryGetStakingRewardParticipantRequestFromPartial} = bze.rewards.QueryStakingRewardParticipantRequest;
const {fromPartial: QueryAllPendingUnlockParticipantRequestFromPartial} = bze.rewards.QueryAllPendingUnlockParticipantsRequest;

export async function getStakingRewards(reverse: boolean = true): Promise<QueryAllStakingRewardsResponseSDKType> {
    try {
        let localData = getFromCache(SR_KEY);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {

                return parsed;
            }
        }

        const client = await getRestClient();
        let response = await client.bze.rewards.allStakingRewards(QueryAllStakingRewardRequestFromPartial({
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
    removeFromCache(SR_KEY);
    if (address !== undefined) {
        removeFromCache(getStakingRewardParticipantCacheKey(address));
        removeFromCache(getStakingRewardsByAddressCacheKey(address));
        removeFromCache(getPendingUnlockCacheKey());
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

export async function getStakingRewardParticipantByAddress(address: string): Promise<QueryStakingRewardParticipantResponseSDKType> {
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
        let response = await client.bze.rewards.stakingRewardParticipant(QueryGetStakingRewardParticipantRequestFromPartial({
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

export async function getPendingUnlockParticipants(): Promise<QueryAllPendingUnlockParticipantsResponseSDKType> {
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
        let response = await client.bze.rewards.allPendingUnlockParticipants(QueryAllPendingUnlockParticipantRequestFromPartial({
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

