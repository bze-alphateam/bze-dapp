import {getRestClient} from "../Client";
import {QueryProposalsResponseSDKType} from "@bze/bzejs/types/codegen/cosmos/gov/v1beta1/query";
import {getFromCache, setInCache} from "@/services/data_provider/cache";

const ACTIVE_PROPOSALS_KEY = 'gov:active_proposals';

const LOCAL_CACHE_TTL = 60 * 15; //15 minutes

export async function getActiveProposals(): Promise<QueryProposalsResponseSDKType> {
    try {
        let localData = getFromCache(ACTIVE_PROPOSALS_KEY);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {
                return parsed;
            }
        }

        const client = await getRestClient();
        //@ts-ignore
        let response = await client.cosmos.gov.v1beta1.proposals({proposalStatus: 2});
        setInCache(ACTIVE_PROPOSALS_KEY, JSON.stringify(response), LOCAL_CACHE_TTL);

        return response;
    } catch (e) {
        console.error(e);

        return {proposals: []};
    }
}
