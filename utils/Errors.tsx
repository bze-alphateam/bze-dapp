// Friendly copy for chain refusals. The chain's raw texts are matched by substring
// (the SDK wraps them with prefixes such as "failed to execute message; message index: 0: ...").
// More specific keys must stay before the generic ones: the first match wins.
const errorsMap: Array<[string, string]> = [
    ["amount is smaller than staking reward min stake", "Amount is smaller than minimum required stake"],
    // IBC rate limit (outgoing transfer over the daily quota)
    ["exceeds quota", "This transfer is over today's limit for this route. Try a smaller amount or try again later."],
    // token blocked for IBC transfers
    ["is blacklisted", "Transfers of this token to and from other chains are stopped for now."],
    // IBC channel closed
    ["ibc transfers on this channel are stopped", "Transfers on this route are stopped for now."],
    ["channel is closed", "Transfers on this route are stopped for now."],
    // message type paused by the circuit breaker
    ["circuit breaker disables execution of this message", "This action is paused on BeeZee for now. Please try again later."],
    ["message is disabled", "This action is paused on BeeZee for now. Please try again later."],
    // non-mintable factory token
    ["minting is disabled for this denom", "Minting is turned off for this token, so no new supply can be created."],
    ["minting is disabled", "Minting is turned off for this token, so no new supply can be created."],
    ["order not found", "This order no longer exists: it may have been filled or cancelled already. Refresh the page."],
    ["insufficient funds", "You don't have enough balance for this transaction (including fees)."],
];

export const prettyError = (err: string|undefined): string|undefined => {
    if (!err) return undefined;

    const lower = err.toLowerCase();
    for (const [key, value] of errorsMap) {
        if (lower.includes(key)) {
            return value;
        }
    }

    return err;
}
