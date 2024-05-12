//import { ProposalStatus } from "@bze/bzejs/types/codegen/cosmos/gov/v1beta1/gov";
import { getRestClient } from "../Client";
import { QueryProposalsResponseSDKType } from "@bze/bzejs/types/codegen/cosmos/gov/v1beta1/query";

const ACTIVE_PROPOSALS_KEY = 'gov:active_proposals';

const LOCAL_CACHE_TTL = 1000 * 60 * 15; //15 minutes

export async function getActiveProposals(): Promise<QueryProposalsResponseSDKType> {
  try {
    let localData = localStorage.getItem(ACTIVE_PROPOSALS_KEY);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
            if (parsed.expiresAt > new Date().getTime()) {
                
                return new Promise<QueryProposalsResponseSDKType> ((resolve) => {
                    resolve({...parsed.params});
                })
            }
        }
    }

    const client = await getRestClient();
    {/* @ts-ignore */}
    let response = await client.cosmos.gov.v1beta1.proposals({proposalStatus: 2});
    let cacheData = {
        params: {...response},
        expiresAt: new Date().getTime() + LOCAL_CACHE_TTL,
    }
    localStorage.setItem(ACTIVE_PROPOSALS_KEY, JSON.stringify(cacheData));

    return new Promise<QueryProposalsResponseSDKType> ((resolve) => {
        resolve(response);
    })
  } catch(e) {
    console.error(e);
    
    return {proposals: []};
  }
}
