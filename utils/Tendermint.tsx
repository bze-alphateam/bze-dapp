import { OrderCanceledEvent, OrderExecutedEvent, OrderSavedEvent } from "@bze/bzejs/types/codegen/beezee/tradebin/events";
import { decodeBase64, snakeToCamel } from "./Functions";
import { bze } from '@bze/bzejs';
import {RaffleLostEvent, RaffleWinnerEvent} from "@bze/bzejs/types/codegen/beezee/burner/events";

const { fromPartial: OrderCanceledEventFromPartial } = bze.tradebin.v1.OrderCanceledEvent;
const { fromPartial: OrderSavedEventFromPartial } = bze.tradebin.v1.OrderSavedEvent;
const { fromPartial: OrderExecutedEventFromPartial } = bze.tradebin.v1.OrderExecutedEvent;

const { fromPartial: RaffleWinnerEventFromPartial } = bze.burner.v1.RaffleWinnerEvent;
const { fromPartial: RaffleLostEventFromPartial } = bze.burner.v1.RaffleLostEvent;

interface Attribute {
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
        const decodedKey = decodeBase64(attr.key);
        const decodedValue = decodeBase64(attr.value);
        result[snakeToCamel(decodedKey)] = JSON.parse(decodedValue);
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
