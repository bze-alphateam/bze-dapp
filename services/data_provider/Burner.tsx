import {getRestClient} from "../Client";
import {QueryAllBurnedCoinsResponseSDKType} from "@bze/bzejs/types/codegen/beezee/burner/query";
import {getActiveProposals} from "./Proposal";
import {getModuleAddress} from "./Account";
import {getAddressBalances} from "./Balances";
import {getCurrentuDenom, transformAttributes} from "@/utils";
import {RaffleSDKType, RaffleWinnerSDKType} from "@bze/bzejs/types/codegen/beezee/burner/raffle";
import {getFromCache, getKeyExpiry, removeFromCache, setInCache, setKeyExpiry} from "@/services/data_provider/cache";
import {getBlockResults, getPeriodicWeekEpochEndTime} from "@/services";

const BURN_EPOCH_COUNT = 4;

export interface NextBurning {
    amount: string,
    denom: string,
    time: Date | undefined,
    isProposal: boolean,
}

const FAILOVER_DATA = {
    burnedCoins: [
        {
            "burned": "29000000000000ubze",
            "height": "10855457"
        },
        {
            "burned": "150000000000000ubze",
            "height": "5149043"
        }
    ]
}

export const BURNER = 'burner';
export const RAFFLE = 'burner_raffle';
const BURNED_KEY = 'burner:all_burned_coins';
const RAFFLES_KEY = 'burner:raffles';
const EPOCH_KEY = 'burner:epoch';
const BURNER_EPOCH = 'hour';
const PROPOSAL_TYPE_BURNING = '/bze.burner.v1.BurnCoinsProposal';
const LOCAL_CACHE_TTL = 60 * 60 * 4; //4 hours
const RAFFLE_CACHE_TTL = 60; // 1 minute

let cacheExpireAt: number = 0;

async function resetBurnedCoinsCache(until: Date): Promise<void> {
    let localData = getFromCache(BURNED_KEY);
    if (null === localData) {
        return;
    }

    let expiry = getKeyExpiry(BURNED_KEY);
    let parsed = JSON.parse(localData);
    if (parsed && expiry !== until) {
        setKeyExpiry(BURNED_KEY, until);
        cacheExpireAt = until.getTime();
    }
}


export async function getAllBurnedCoins(): Promise<QueryAllBurnedCoinsResponseSDKType> {
    try {
        let localData = getFromCache(BURNED_KEY);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {

                return parsed;
            }
        }

        const client = await getRestClient();
        //@ts-ignore
        let response = await client.bze.burner.v1.allBurnedCoins({pagination: {reverse: true}});
        setInCache(BURNED_KEY, JSON.stringify(response), LOCAL_CACHE_TTL);

        return response;
    } catch (e) {
        console.error(e);
        return FAILOVER_DATA;
    }
}

export async function getNextBurning(): Promise<NextBurning | undefined> {
    let address = await getModuleAddress(BURNER);
    if (address === '') {
        return undefined;
    }

    let balances = await getAddressBalances(address);
    if (balances.balances.length === 0) {
        return undefined;
    }

    let curentUDenom = getCurrentuDenom();
    let bzeBalance = balances.balances.filter(item => item.denom === curentUDenom);
    if (bzeBalance.length === 0) {
        return undefined;
    }

    const timeFromProposals = await getBurningTimeFromProposal();
    const timeFromEpoch = await getBurningTimeFromEpoch();

    if (!timeFromProposals && !timeFromEpoch) {
        return undefined;
    }

    let next = timeFromProposals;
    let isProposal = true;
    if (!next) {
        next = timeFromEpoch;
        isProposal = false;
    } else if (timeFromEpoch && timeFromEpoch < next) {
        next = timeFromEpoch;
        isProposal = false;
    }

    if (!next) {
        return undefined;
    }

    //if we have a proposal that will burn coins, set the TTL for all burned coins listing response at voting time end.
    //this way the cache is available until that moment, and we are sure it will reset right after the voting period ended
    if (next.getTime() !== cacheExpireAt) {
        await resetBurnedCoinsCache(next);
    }

    return {
        amount: bzeBalance[0].amount,
        denom: bzeBalance[0].denom,
        time: next,
        isProposal: isProposal,
    }
}

async function getBurningTimeFromEpoch(): Promise<Date|undefined> {
    return await getPeriodicWeekEpochEndTime(BURN_EPOCH_COUNT);
}

async function getBurningTimeFromProposal(): Promise<Date|undefined> {
    const proposals = await getActiveProposals();
    if (proposals.proposals.length === 0) {
        return undefined;
    }

    //@ts-ignore
    const filtered = proposals.proposals.find((item) => item.content['@type'] === PROPOSAL_TYPE_BURNING);
    if (!filtered || filtered.voting_end_time === undefined) {
        return undefined;
    }

    return new Date(filtered.voting_end_time);
}

export async function getRaffles(): Promise<RaffleSDKType[]> {
    try {
        const cacheKey = RAFFLES_KEY;
        let localData = getFromCache(cacheKey);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {
                return parsed.list;
            }
        }

        const client = await getRestClient();
        const response = await client.bze.burner.v1.raffles();

        setInCache(cacheKey, JSON.stringify(response), RAFFLE_CACHE_TTL)

        return response.list;
    } catch (e) {
        console.error(e);

        return [];
    }
}

export async function removeRafflessCache() {
    removeFromCache(RAFFLES_KEY);
}


export async function getRaffleModuleAddress(): Promise<string> {
    return getModuleAddress(RAFFLE);
}

export async function getBurnerCurrentEpoch(): Promise<number> {
    try {
        const cacheKey = EPOCH_KEY;
        let localData = getFromCache(cacheKey);
        if (null !== localData) {
            let parsed = parseInt(localData);
            if (parsed) {
                return parsed;
            }
        }

        const client = await getRestClient();
        const response = await client.bze.epochs.v1.currentEpoch({identifier: BURNER_EPOCH});

        setInCache(cacheKey, `${response.current_epoch}`, RAFFLE_CACHE_TTL)

        //@ts-ignore
        return response.current_epoch;
    } catch (e) {
        console.error(e);

        return 0;
    }
}

export async function getRaffleWinners(denom: string): Promise<RaffleWinnerSDKType[]> {
    try {
        const client = await getRestClient();
        const response = await client.bze.burner.v1.raffleWinners({denom: denom});
        return response.list;
    } catch (e) {
        console.error(e);

        return [];
    }
}

interface RaffleResult {
    hasWon: boolean;
    amount: number;
    denom: string;
    address: string;
}

export async function checkAddressWonRaffle(address: string, denom: string, height: number): Promise<RaffleResult> {
    const response = {
        hasWon: false,
        amount: 0,
        denom: denom,
        address: address,
    };
    if (address == "" || height <= 0) {
        return response;
    }

    const blockResults = await getBlockResults(height);
    if (!blockResults) {
        console.error('got invalid block results from rpc');
        return response;
    }

    if (!blockResults.result?.end_block_events) {
        return response;
    }

    if (blockResults.result.end_block_events.length === 0) {
        return response;
    }


    const raffleEvents = blockResults.result.end_block_events.filter(ev => ev.type.includes('Raffle'));
    if (!raffleEvents || raffleEvents.length === 0) {
        return response;
    }

    for (let i = 0; i < raffleEvents.length; i++) {
        const ev = raffleEvents[i];
        const converted = transformAttributes(ev.attributes)
        if ('participant' in converted && ev.type.includes('RaffleLostEvent') && converted['participant'] === address) {
            return response;
        }

        if ('winner' in converted && ev.type.includes('RaffleWinnerEvent') && converted['winner'] === address && converted['denom'] === denom) {
            response.hasWon = true;
            response.amount = converted['amount'];
            return response;
        }
    }

    return response;
}
