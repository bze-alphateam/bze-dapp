import { getRestClient } from "../Client";
import { QueryAllBurnedCoinsResponseSDKType } from "@bze/bzejs/types/codegen/beezee/burner/query";
import { getActiveProposals } from "./Proposal";
import { getModuleAddress } from "./Account";
import { getAddressBalances } from "./Balances";
import { getCurrentuDenom } from "@/utils";
import {RaffleSDKType, RaffleWinnerSDKType} from "@bze/bzejs/types/codegen/beezee/burner/raffle";
import {getFromCache, setInCache} from "@/services/data_provider/cache";

export interface NextBurning {
  amount: string,
  denom: string,
  time: Date|undefined,
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
  let localData = localStorage.getItem(BURNED_KEY);
    if (null === localData) {
        return;
    }

    let parsed = JSON.parse(localData);
    if (parsed && parsed.expiresAt !== until) {
      parsed.expiresAt = until.getTime();
      cacheExpireAt = parsed.expiresAt
      localStorage.setItem(BURNED_KEY, JSON.stringify(parsed));
    }
}


export async function getAllBurnedCoins(): Promise<QueryAllBurnedCoinsResponseSDKType> {
  try {
    let localData = localStorage.getItem(BURNED_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
          cacheExpireAt = parsed.expiresAt;
          if (parsed.expiresAt > new Date().getTime()) {
              
              return new Promise<QueryAllBurnedCoinsResponseSDKType> ((resolve) => {
                  resolve({...parsed.params});
              })
          }
        }
    }

    const client = await getRestClient();
    {/* @ts-ignore */}
    let response = await client.bze.burner.v1.allBurnedCoins({pagination: {reverse: true}});
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + LOCAL_CACHE_TTL,
    }
    cacheExpireAt = cacheData.expiresAt;
    localStorage.setItem(BURNED_KEY, JSON.stringify(cacheData));

    return new Promise<QueryAllBurnedCoinsResponseSDKType> ((resolve) => {
        resolve(response);
    })
  } catch(e) {
    console.error(e);
    return FAILOVER_DATA;
  }
}

export async function getNextBurning(): Promise<NextBurning|undefined> {
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

  const proposals = await getActiveProposals();
  if (proposals.proposals.length === 0) {
    return {
      amount: bzeBalance[0].amount,
      denom: bzeBalance[0].denom,
      time: undefined,
    }
  }

  {/* @ts-ignore */}
  const filtered = proposals.proposals.filter((item) => item.content['@type'] === PROPOSAL_TYPE_BURNING);
  if (filtered.length === 0 || filtered[0].voting_end_time === undefined) {
    return {
      amount: bzeBalance[0].amount,
      denom: bzeBalance[0].denom,
      time: undefined,
    }
  }

  //check the date
  let checkDate = new Date(filtered[0].voting_end_time);
  //if we have a proposal that will burn coins, set the TTL for all burned coins listing response at voting time end.
  //this way the cache is available until that moment and we are sure it will reset right after the voting period ended
  if (checkDate.getTime() !== cacheExpireAt) {
    resetBurnedCoinsCache(checkDate);
  }

  return {
    amount: bzeBalance[0].amount,
    denom: bzeBalance[0].denom,
    time: filtered[0].voting_end_time,
  }
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
  } catch(e) {
    console.error(e);

    return [];
  }
}

export async function removeRafflessCache() {
  localStorage.removeItem(RAFFLES_KEY);
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
  } catch(e) {
    console.error(e);

    return 0;
  }
}

export async function getRaffleWinners(denom: string): Promise<RaffleWinnerSDKType[]> {
  try {
    const client = await getRestClient();
    const response = await client.bze.burner.v1.raffleWinners({denom: denom});
    return response.list;
  } catch(e) {
    console.error(e);

    return [];
  }
}
