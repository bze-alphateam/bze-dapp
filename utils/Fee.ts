import {coins, StdFee} from "@cosmjs/stargate";

export interface FeeToken {
    denom: string;
    average_gas_price?: number;
    fixed_min_gas_price?: number;
}

export interface Simulator {
    simulate(address: string, messages: any[], memo?: string): Promise<number>;
}

// Simulates the tx and builds the fee from the result (gas x1.5). A failed simulation throws: the
// tx would fail on chain too (IBC rate limits, blacklists, circuit breaker...) and the user
// would lose the fee, so callers must not broadcast.
export async function simulateFee(
    address: string,
    simulator: Simulator,
    messages: any[],
    defaultDenom: string,
    memo?: string,
    feeToken?: FeeToken
): Promise<StdFee> {
    let gasPrice = 0.1;
    let gasDenom = defaultDenom;
    if (feeToken) {
        gasDenom = feeToken.denom;
        gasPrice = feeToken.average_gas_price ?? feeToken.fixed_min_gas_price ?? 0.1;
    }

    const gasEstimated = await simulator.simulate(address, messages, memo);
    const gasAmount = gasEstimated * 1.5;
    const gasPayment = (gasAmount * gasPrice).toFixed(0).toString();

    return {
        amount: coins(gasPayment, gasDenom),
        gas: gasAmount.toFixed(0),
    };
}
