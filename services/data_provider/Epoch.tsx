import {QueryAllStakingRewardResponseSDKType} from "@bze/bzejs/types/codegen/beezee/rewards/query";
import {getFromCache, setInCache} from "@/services/data_provider/cache";
import {getRestClient} from "@/services";
import {QueryEpochsInfoResponseSDKType} from "@bze/bzejs/types/codegen/beezee/epochs/query";
import {bze} from "@bze/bzejs";
import {EpochInfo} from "@bze/bzejs/types/codegen/beezee/epochs/genesis";
import {EpochInfoSDKType} from "@bze/bzejs/src/codegen/beezee/epochs/genesis";

const EPOCHS_KEY = "epochs:info";
const EPOCHS_INFO_TTL = 1000 * 60 * 5;

export async function getEpochsInfo(): Promise<QueryEpochsInfoResponseSDKType> {
    try {
        let localData = getFromCache(EPOCHS_KEY);
        if (null !== localData) {
            let parsed = JSON.parse(localData);
            if (parsed) {

                return parsed;
            }
        }

        const client = await getRestClient();
        let response = await client.bze.epochs.v1.epochInfos();
        setInCache(EPOCHS_KEY, JSON.stringify(response), EPOCHS_INFO_TTL);

        return response
    } catch (e) {
        console.error(e);

        return {epochs: []};
    }
}

export async function getCurrentEpoch(identifier: string): Promise<EpochInfoSDKType|undefined> {
    const all = await getEpochsInfo();

    return all.epochs.find((item) => item.identifier === identifier);
}

export async function getHourEpochInfo() {
    return getCurrentEpoch("hour");
}
