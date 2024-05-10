import { getRestClient } from "../Client";
import { QueryAllBurnedCoinsResponseSDKType } from "@bze/bzejs/types/codegen/beezee/burner/query";
import { getActiveProposals } from "./Proposal";
import { getModuleAddress } from "./Account";
import { getAddressBalances } from "./Balances";
import { getCurrentuDenom } from "@/utils";

export interface NextBurning {
  amount: string,
  denom: string,
  time: Date,
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

const BURNER = 'burner';
const BURNED_KEY = 'burner:all_burned_coins';
const PROPOSAL_TYPE_BURNING = '/bze.burner.v1.BurnCoinsProposal';
const LOCAL_CACHE_TTL = 1000 * 60 * 60 * 4; //4 hours

export async function getAllBurnedCoins(): Promise<QueryAllBurnedCoinsResponseSDKType> {
  try {
    let localData = localStorage.getItem(BURNED_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {
                
                return new Promise<QueryAllBurnedCoinsResponseSDKType> ((resolve) => {
                    resolve({...parsed.params});
                })
            }
        }
    }

    const client = await getRestClient();
    let response = await client.bze.burner.v1.allBurnedCoins({pagination: {reverse: true}});
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + LOCAL_CACHE_TTL,
    }
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
  const proposals = await getActiveProposals();
  if (proposals.proposals.length === 0) {
    return undefined;
  }

  const filtered = proposals.proposals.filter((item) => item.content['@type'] === PROPOSAL_TYPE_BURNING);
  if (filtered.length === 0 || filtered[0].voting_end_time === undefined) {
    return undefined;
  }

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

  return {
    amount: bzeBalance[0].amount,
    denom: bzeBalance[0].denom,
    time: filtered[0].voting_end_time,
  }
}
