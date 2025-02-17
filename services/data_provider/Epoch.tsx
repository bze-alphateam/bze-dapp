import {getFromCache, setInCache} from "@/services/data_provider/cache";
import {getRestClient} from "@/services";
import {QueryEpochsInfoResponseSDKType} from "@bze/bzejs/types/codegen/beezee/epochs/query";
import Long from "long";
import {EpochInfoSDKType} from "@bze/bzejs/src/codegen/beezee/epochs/genesis";

const EPOCHS_KEY = "epochs:info";
const EPOCHS_INFO_TTL = 60 * 5;

//using custom type to avoid type checking failure when building
export interface EpochInfoAppType extends EpochInfoSDKType{
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

export async function getWeekEpochInfo() {
    return getCurrentEpoch("week");
}

export async function getCurrentWeekEpochEndTime(): Promise<Date|undefined> {
    return getEpochEndTime("week");
}

export async function getEpochEndTime(identifier: string): Promise<Date|undefined> {
    const epoch = await getCurrentEpoch(identifier);
    if (!epoch || !epoch.current_epoch_start_time) {
        return undefined;
    }

    const startAt = (new Date(epoch.current_epoch_start_time));
    startAt.setTime(startAt.getTime() + getEpochDurationByIdentifier(identifier));

    return startAt;
}

function getEpochDurationByIdentifier(identifier: string): number {
    const hourMs = 60 * 60 * 1000;
    switch (identifier) {
        case "hour":
            return hourMs;
        case "day":
            return hourMs * 24;
        case "week":
            return hourMs * 24 * 7;
        default:
            return hourMs;
    }
}
