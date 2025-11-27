import {OrderCanceledEvent, OrderExecutedEvent, OrderSavedEvent} from "@bze/bzejs/bze/tradebin/events";
import {snakeToCamel} from "./Functions";
import {bze} from '@bze/bzejs';
import {RaffleLostEvent, RaffleWinnerEvent} from "@bze/bzejs/bze/burner/events";

const {fromPartial: OrderCanceledEventFromPartial} = bze.tradebin.OrderCanceledEvent;
const {fromPartial: OrderSavedEventFromPartial} = bze.tradebin.OrderSavedEvent;
const {fromPartial: OrderExecutedEventFromPartial} = bze.tradebin.OrderExecutedEvent;

const {fromPartial: RaffleWinnerEventFromPartial} = bze.burner.RaffleWinnerEvent;
const {fromPartial: RaffleLostEventFromPartial} = bze.burner.RaffleLostEvent;

export interface Attribute {
    key: string;
    value: string;
    index: boolean;
}

export interface TendermintEvent {
    type: string;
    attributes: Attribute[];
}

export const transformAttributes = (attributes: Attribute[]) => {
    const result: { [key: string]: any } = {};

    attributes.forEach(attr => {
        result[snakeToCamel(attr.key)] = attr.value.replace('\"', '').replace('\"', '');
    });

    return result;
}

export const parseOrderCanceledEvent = (event: TendermintEvent): OrderCanceledEvent => {
    let attributes = transformAttributes(event.attributes);

    return OrderCanceledEventFromPartial(attributes);
}

export const parseOrderSavedEvent = (event: TendermintEvent): OrderSavedEvent => {
    let attributes = transformAttributes(event.attributes);

    return OrderSavedEventFromPartial(attributes);
}

export const parseOrderExecutedEvent = (event: TendermintEvent): OrderExecutedEvent => {
    let attributes = transformAttributes(event.attributes);

    return OrderExecutedEventFromPartial(attributes);
}

export const parseRaffleLostEvent = (event: TendermintEvent): RaffleLostEvent => {
    let attributes = transformAttributes(event.attributes);

    return RaffleLostEventFromPartial(attributes);
}

export const parseRaffleWinnerEvent = (event: TendermintEvent): RaffleWinnerEvent => {
    let attributes = transformAttributes(event.attributes);

    return RaffleWinnerEventFromPartial(attributes);
}
