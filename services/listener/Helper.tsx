import {TendermintEvent} from "@/utils";

export const filterEventsFromWs = (wsData: any, eventType: string, transformer: any): TendermintEvent[] => {
    if (!wsData.result?.data?.value?.finalize_block_events?.events) {
        return [];
    }

    const allEvents = wsData.result.data.value.finalize_block_events.events;
    const result = [];
    for (let i = 0; i < allEvents.length; i++) {
        if (allEvents[i].type !== eventType) {
            continue;
        }

        result.push(transformer(allEvents[i]));
    }


    return result;
}

export const callbacksMultiCallMultiArgs = (callbacks: any[], args: any[]) => {
    for (let i = 0; i < callbacks.length; i++) {
        for (let j = 0; j < args.length; j++) {
            callbacks[i](args[j]);
        }
    }
}

export const callbacksMultiCall = (callbacks: any[]) => {
    for (let i = 0; i < callbacks.length; i++) {
        callbacks[i]();
    }
}
