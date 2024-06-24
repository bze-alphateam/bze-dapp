

import { getRpcURL } from "../Client";
import { TendermintEvent, parseOrderCanceledEvent, parseOrderExecutedEvent, parseOrderSavedEvent } from "@/utils";
import { OrderCanceledEvent, OrderExecutedEvent, OrderSavedEvent } from "@bze/bzejs/types/codegen/beezee/tradebin/events";

const getWS = (): WebSocket => {
  const rpc = getRpcURL();
  const wsAddress = `${rpc}/websocket`;

  return new WebSocket(wsAddress);
}

const SUB_ID_RECIPIENT = 1;
const SUB_ID_SENDER = 2;
const SUB_ID_ORDER_SAVED = 3;
const SUB_ID_ORDER_CANCELED = 4;
const SUB_ID_ORDER_EXECUTED = 5;

const TYPE_ORDER_SAVED_EVENT = 'bze.tradebin.v1.OrderSavedEvent';
const TYPE_ORDER_EXECUTED_EVENT = 'bze.tradebin.v1.OrderExecutedEvent';
const TYPE_ORDER_CANCELED_EVENT = 'bze.tradebin.v1.OrderCanceledEvent';

const buildSubscribePayload = (id: number, query: string): string => {
  return JSON.stringify({
    jsonrpc: "2.0",
    method: "subscribe",
    id: id,
    params: {
        query: query
    }
  });
}

const buildUnsubscribePayload = (id: number, query: string): string => {
  return JSON.stringify({
    jsonrpc: "2.0",
    method: "unsubscribe",
    id: id,
    params: {
        query: query
    }
  });
}

const subscribeToAddressTxes = (WS: WebSocket, address: string) => {
  const subscriptionQueryRecipient = `tm.event = 'Tx' AND transfer.recipient = '${address}'`;
  // Subscribe to transactions
  WS.send(buildSubscribePayload(SUB_ID_RECIPIENT, subscriptionQueryRecipient));

  const subscriptionQuerySender = `tm.event = 'Tx' AND transfer.sender = '${address}'`;
  WS.send(buildSubscribePayload(SUB_ID_RECIPIENT, subscriptionQuerySender));
}

const unsubscribeToAddressTxes = (WS: WebSocket, address: string) => {
  const subscriptionQueryRecipient = `tm.event = 'Tx' AND transfer.recipient = '${address}'`;
  // Subscribe to transactions
  WS.send(buildUnsubscribePayload(SUB_ID_RECIPIENT, subscriptionQueryRecipient));

  const subscriptionQuerySender = `tm.event = 'Tx' AND transfer.sender = '${address}'`;
  WS.send(buildUnsubscribePayload(SUB_ID_RECIPIENT, subscriptionQuerySender));
}

const subscribeToOrderExecutedEvent = (WS: WebSocket, marketId: string) => {
  const query = `tm.event = 'NewBlock' AND bze.tradebin.v1.OrderExecutedEvent.market_id CONTAINS '${marketId}'`;
  WS.send(buildSubscribePayload(SUB_ID_ORDER_EXECUTED, query));
}

const subscribeToOrderCanceledEvent = (WS: WebSocket, marketId: string) => {
  const query = `tm.event = 'NewBlock' AND bze.tradebin.v1.OrderCanceledEvent.market_id CONTAINS '${marketId}'`;
  WS.send(buildSubscribePayload(SUB_ID_ORDER_CANCELED, query));
}

const subscribeToOrderSavedEvent = (WS: WebSocket, marketId: string) => {
  const query = `tm.event = 'NewBlock' AND bze.tradebin.v1.OrderSavedEvent.market_id CONTAINS '${marketId}'`;
  WS.send(buildSubscribePayload(SUB_ID_ORDER_SAVED, query));
}

const unsubscribeAll = (WS: WebSocket) => {
  WS.send(JSON.stringify({
      jsonrpc: "2.0",
      method: "unsubscribe_all",
      id: 0,
  }));
}

const filterEventsFromWs = (wsData: any, eventType: string, transformer: any): TendermintEvent[] => {
  if (!wsData.result?.data?.value?.result_end_block?.events) {
    return [];
  }

  const allEvents = wsData.result.data.value.result_end_block.events;
  const result = [];
  for (let i = 0; i < allEvents.length; i++) {
    if (allEvents[i].type !== eventType) {
      continue;
    }

    result.push(transformer(allEvents[i]));
  }


  return result;
}

const multiCallbacksCall = (callbacks: any[], args: any[]) => {
  for (let i = 0; i < callbacks.length; i++) {
    for (let j = 0; j < args.length; j++) {
      callbacks[i](args[j]);
    }
  }
}

class Listener {
  private WS: WebSocket|null = null;
  
  private listenedAddress: string|null = null;
  private balanceChangeCallbacks: (() => void)[] = [];

  private listenedMarketId: string|null = null;
  private orderSavedCallbacks: ((event: OrderExecutedEvent) => void)[] = [];
  private orderExecutedCallbacks: ((event: OrderExecutedEvent) => void)[] = [];
  private orderCanceledCallbacks: ((event: OrderCanceledEvent) => void)[] = [];

  private getWs(): WebSocket {
    if (this.WS === null) {
      this.WS = getWS();
    }

    //if the connection is CLOSED or CLOSING recreate the websocket
    if (this.WS.readyState > 1) {
      this.WS = getWS();
    }

    return this.WS;
  }

  private performSubscribe(ws: WebSocket) {
    if (this.listenedAddress !== null) {
      subscribeToAddressTxes(this.getWs(), this.listenedAddress);
    }

    if (this.listenedMarketId !== null) {
      subscribeToOrderSavedEvent(ws, this.listenedMarketId);
      subscribeToOrderCanceledEvent(ws, this.listenedMarketId);
      subscribeToOrderExecutedEvent(ws, this.listenedMarketId);
    }
  }

  private handleEvent(e: any) {
    if (e.result === undefined) {
      return;
    }

    if (e.id === SUB_ID_SENDER || e.id === SUB_ID_RECIPIENT) {
      for (let i = 0; i < this.balanceChangeCallbacks.length; i++) {
        this.balanceChangeCallbacks[i]();
      }

      return;
    }
    
    if (e.id === SUB_ID_ORDER_SAVED) {
      const ev = filterEventsFromWs(e, TYPE_ORDER_SAVED_EVENT, parseOrderSavedEvent);
      multiCallbacksCall(this.orderSavedCallbacks, ev);
      
      return;
    }

    if (e.id === SUB_ID_ORDER_CANCELED) {
      const ev = filterEventsFromWs(e, TYPE_ORDER_CANCELED_EVENT, parseOrderCanceledEvent);
      multiCallbacksCall(this.orderCanceledCallbacks, ev);
      
      return;
    }

    if (e.id === SUB_ID_ORDER_EXECUTED) {
      const ev = filterEventsFromWs(e, TYPE_ORDER_EXECUTED_EVENT, parseOrderExecutedEvent);
      multiCallbacksCall(this.orderExecutedCallbacks, ev);
      
      return;
    }
  }

  onBalanceChange(callback: () => void) {
    this.balanceChangeCallbacks.push(callback);
  }

  onOrderSaved(callback: (event: OrderSavedEvent) => void) {
    this.orderSavedCallbacks.push(callback);
  }

  onOrderCanceled(callback: (event: OrderCanceledEvent) => void) {
    this.orderCanceledCallbacks.push(callback);
  }

  onOrderExecuted(callback: (event: OrderExecutedEvent) => void) {
    this.orderExecutedCallbacks.push(callback);
  }

  listenAddressBalance(address: string) {
    this.listenedAddress = address;
  }

  listenMarket(marketId: string) {
    this.listenedMarketId = marketId;
  }

  start() {
    let ws = this.getWs();
    this.cleanup();
    if (ws.readyState === 1) {
      this.performSubscribe(ws);
    }

    ws.onclose = () => {
      console.log("listener: closed connection");
    }

    ws.onerror = (e) => {
      console.error("listener: error observed:", e);
    };

    ws.onopen = () => {
      console.log("listener: opened connection");
      this.performSubscribe(ws);
    }

    ws.onmessage = (e) => {
      const decoded = JSON.parse(e.data);
      this.handleEvent(decoded);
    };
  }

  cleanup() {
    if (this.WS === null) {
      //nothing to close
      return;
    }

    //if the connection is OPEN
    if (this.WS.readyState === 1) {
      unsubscribeAll(this.WS);
    }
  }

  stop() {
    this.removeAllCallbacks();
    if (this.WS === null) {
      //nothing to close
      return;
    }

    if (this.WS.readyState <= 1) {
      this.WS.close();
    }
  }

  removeListenAddressBalance() {
    if (this.WS !== null && this.WS.readyState === 1 && this.listenedAddress !== null) {
      unsubscribeToAddressTxes( this.WS, this.listenedAddress);
    }

    this.balanceChangeCallbacks = [];
    this.listenedAddress = null;
  }

removeAllCallbacks() {
    this.balanceChangeCallbacks = [];
    this.orderCanceledCallbacks = [];
    this.orderExecutedCallbacks = [];
    this.orderSavedCallbacks = [];
  }
}

const BlockListener = new Listener();

export default BlockListener;
