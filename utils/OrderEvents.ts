export const ORDER_REFUNDED_EVENT = "bze.tradebin.OrderMessageRefundedEvent";
export const REFUND_REASON_MAX_FILLS = "max_fills_reached";

interface TxEvent {
    type: string;
    attributes: ReadonlyArray<{ key: string; value?: string }>;
}

// Typed events carry JSON values, so strings may come wrapped in quotes.
const unquote = (value: string | undefined): string => (value ?? "").replace(/^"(.*)"$/, "$1");

// True when the tx refunded part of an order because it hit the chain's max fills per order.
// Older chains never emit the event, so this is false there.
export function hasMaxFillsRefund(events: ReadonlyArray<TxEvent> | undefined): boolean {
    return (events ?? []).some((event) =>
        event.type === ORDER_REFUNDED_EVENT &&
        event.attributes.some((attr) => attr.key === "reason" && unquote(attr.value) === REFUND_REASON_MAX_FILLS)
    );
}
