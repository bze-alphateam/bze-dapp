import {getFromCache, setInCache} from "@/services/data_provider/cache";
import {getRestClient} from "@/services";
import Long from "long";
import {QueryEpochsInfoResponseSDKType} from "@bze/bzejs/bze/epochs/query";

const EPOCHS_KEY = "epochs:info";
const EPOCHS_INFO_TTL = 60 * 5;

const EPOCH_HOUR = "hour";
const EPOCH_DAY = "day";
const EPOCH_WEEK = "week";

//using custom type to avoid type checking failure when building
export interface EpochInfoAppType {
    identifier: string;
    current_epoch: Long;
    current_epoch_start_time?: Date;
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
        let response = await client.bze.epochs.epochInfos();
        setInCache(EPOCHS_KEY, JSON.stringify(response), EPOCHS_INFO_TTL);

        return response
    } catch (e) {
        console.error(e);

        return {epochs: []};
    }
}

export async function getCurrentEpoch(identifier: string): Promise<EpochInfoAppType|undefined> {
    const all = await getEpochsInfo();

    // @ts-ignore
    return all.epochs.find((item: EpochInfoAppType) => item.identifier === identifier);
}

export async function getHourEpochInfo() {
    return getCurrentEpoch(EPOCH_HOUR);
}

export async function getWeekEpochInfo() {
    return getCurrentEpoch(EPOCH_WEEK);
}

export async function getCurrentWeekEpochEndTime(): Promise<Date|undefined> {
    return getPeriodicEpochEndTime(EPOCH_WEEK);
}

export async function getPeriodicWeekEpochEndTime(modWeek: number = 1): Promise<Date|undefined> {
    return getPeriodicEpochEndTime(EPOCH_WEEK, modWeek);
}

// returns the end time of an epoch. If modWeek is provided it will return the end time of the epoch maching the mod.
// example: to return the end of a week epoch happening once every 4 weeks use modWeek = 4
export async function getPeriodicEpochEndTime(identifier: string, modWeek: number = 1): Promise<Date|undefined> {
    const epoch = await getCurrentEpoch(identifier);
    if (!epoch || !epoch.current_epoch_start_time) {
        return undefined;
    }
    const current = Long.fromValue(epoch.current_epoch).toNumber();
    let remainingEpochs = modWeek - (current % modWeek);
    if (remainingEpochs === modWeek) {
        remainingEpochs = 0;
    }

    const startAt = (new Date(epoch.current_epoch_start_time));
    const duration = getEpochDurationByIdentifier(identifier);
    startAt.setTime(startAt.getTime() + duration + (duration * remainingEpochs));

    return startAt;
}

function getEpochDurationByIdentifier(identifier: string): number {
    const hourMs = 60 * 60 * 1000;
    switch (identifier) {
        case EPOCH_HOUR:
            return hourMs;
        case EPOCH_DAY:
            return hourMs * 24;
        case EPOCH_WEEK:
            return hourMs * 24 * 7;
        default:
            return hourMs;
    }
}
