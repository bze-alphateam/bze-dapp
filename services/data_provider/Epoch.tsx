import {getFromCache, setInCache} from "@/services/data_provider/cache";
import {getRestClient} from "@/services";
import {QueryEpochsInfoResponseSDKType} from "@bze/bzejs/types/codegen/beezee/epochs/query";
import Long from "long";

const EPOCHS_KEY = "epochs:info";
const EPOCHS_INFO_TTL = 60 * 5;

//using custom type to avoid type checking failure when building
export interface EpochInfoAppType {
    identifier: string;
    current_epoch: Long;
}

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

export async function getCurrentEpoch(identifier: string): Promise<EpochInfoAppType|undefined> {
    const all = await getEpochsInfo();

    return all.epochs.find((item) => item.identifier === identifier);
}

export async function getHourEpochInfo() {
    return getCurrentEpoch("hour");
}
