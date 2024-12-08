import {OrderCanceledEvent, OrderExecutedEvent, OrderSavedEvent} from "@bze/bzejs/types/codegen/beezee/tradebin/events";
import {callbacksMultiCallMultiArgs, filterEventsFromWs} from "./Helper";
import {parseOrderCanceledEvent, parseOrderExecutedEvent, parseOrderSavedEvent} from "@/utils";
import TmWebSocket from "./WebSocket";

const orderSavedEventQuery = (marketId: string) => `tm.event = 'NewBlock' AND bze.tradebin.v1.OrderSavedEvent.market_id CONTAINS '${marketId}'`;
const orderCanceledEventQuery = (marketId: string) => `tm.event = 'NewBlock' AND bze.tradebin.v1.OrderCanceledEvent.market_id CONTAINS '${marketId}'`
const orderExecutedEventQuery = (marketId: string) => `tm.event = 'NewBlock' AND bze.tradebin.v1.OrderExecutedEvent.market_id CONTAINS '${marketId}'`;

const SUB_ID_ORDER_SAVED = 3;
const SUB_ID_ORDER_CANCELED = 4;
const SUB_ID_ORDER_EXECUTED = 5;

const TYPE_ORDER_SAVED_EVENT = 'bze.tradebin.v1.OrderSavedEvent';
const TYPE_ORDER_EXECUTED_EVENT = 'bze.tradebin.v1.OrderExecutedEvent';
const TYPE_ORDER_CANCELED_EVENT = 'bze.tradebin.v1.OrderCanceledEvent';

class Listener {
    private isStarted: boolean = false;
    private marketId: string = "";
    private orderSavedCallbacks: ((event: OrderSavedEvent) => void)[] = [];
    private orderExecutedCallbacks: ((event: OrderExecutedEvent) => void)[] = [];
    private orderCanceledCallbacks: ((event: OrderCanceledEvent) => void)[] = [];

    setMarketId(marketId: string) {
        if (marketId === this.marketId) {
            return;
        }

        if (this.isStarted) {
            this.stop();
        }
        this.marketId = marketId;
    }

    clearAllCallbacks(): void {
        this.orderSavedCallbacks = [];
        this.orderExecutedCallbacks = [];
        this.orderCanceledCallbacks = [];
    }

    addOnOrderExecutedCallback(cb: (event: OrderExecutedEvent) => void): void {
        this.orderExecutedCallbacks.push(cb);
    }

    addOnOrderCanceledCallback(cb: (event: OrderCanceledEvent) => void): void {
        this.orderCanceledCallbacks.push(cb);
    }

    addOnOrderSavedCallback(cb: (event: OrderSavedEvent) => void): void {
        this.orderSavedCallbacks.push(cb);
    }

    start(): void {
        if (this.isStarted) {
            return;
        }

        if (this.marketId !== "") {
            TmWebSocket.subscribe(SUB_ID_ORDER_SAVED, orderSavedEventQuery(this.marketId), (e: any) => {
                this.onOrderSaved(e)
            });
            TmWebSocket.subscribe(SUB_ID_ORDER_CANCELED, orderCanceledEventQuery(this.marketId), (e: any) => {
                this.onOrderCancelled(e)
            });
            TmWebSocket.subscribe(SUB_ID_ORDER_EXECUTED, orderExecutedEventQuery(this.marketId), (e: any) => {
                this.onOrderExecuted(e)
            });

            this.isStarted = true;
        }
    }

    stop(): void {
        if (!this.isStarted) {
            return;
        }

        if (this.marketId !== "") {
            TmWebSocket.unsubscribe(SUB_ID_ORDER_SAVED);
            TmWebSocket.unsubscribe(SUB_ID_ORDER_CANCELED);
            TmWebSocket.unsubscribe(SUB_ID_ORDER_EXECUTED);

            this.isStarted = false;
        }
    }

    private onOrderSaved(e: any): void {
        const ev = filterEventsFromWs(e, TYPE_ORDER_SAVED_EVENT, parseOrderSavedEvent);
        callbacksMultiCallMultiArgs(this.orderSavedCallbacks ?? [], ev);
    }

    private onOrderExecuted(e: any): void {
        const ev = filterEventsFromWs(e, TYPE_ORDER_EXECUTED_EVENT, parseOrderExecutedEvent);
        callbacksMultiCallMultiArgs(this.orderExecutedCallbacks ?? [], ev);
    }

    private onOrderCancelled(e: any): void {
        const ev = filterEventsFromWs(e, TYPE_ORDER_CANCELED_EVENT, parseOrderCanceledEvent);
        callbacksMultiCallMultiArgs(this.orderCanceledCallbacks ?? [], ev);
    }
}

const MarketPairListener = new Listener();

export default MarketPairListener;
