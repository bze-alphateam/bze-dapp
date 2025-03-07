// import { cosmos } from 'interchain-query';
import {useChain} from '@cosmos-kit/react';
import {coins, DeliverTxResponse, isDeliverTxSuccess, StdFee} from '@cosmjs/stargate';
import {type CustomToast, useToast} from './useToast';
import {keplrSuggestChain} from '@/config';
import {getSigningClient} from '@/services';
import {getChainName, getMinDenom, prettyError} from '@/utils';
import {FeeToken} from "@chain-registry/types/chain.schema";
import {ibc} from "interchain-query";
import fee = ibc.applications.fee;

interface Msg {
    typeUrl: string;
    value: any;
}

interface TxOptions {
    fee?: StdFee | null;
    toast?: Partial<CustomToast>;
    onSuccess?: (res: DeliverTxResponse) => void;
    useDirectSign?: boolean;
    isIbc?: boolean;
}

export enum TxStatus {
    Failed = 'Transaction Failed',
    Successful = 'Transaction Successful',
    Broadcasting = 'Transaction Broadcasting',
}

const simulateFee = async (address: string, signingClient: any, messages: any[], memo?: string | undefined, feeToken?: FeeToken|undefined): Promise<StdFee> => {
    try {
        let gasPrice = 0.1;
        let gasDenom = getMinDenom();
        if (feeToken) {
            gasDenom = feeToken.denom;
            gasPrice = feeToken.average_gas_price ?? feeToken.fixed_min_gas_price ?? 0.1
        }

        const gasEstimated = await signingClient.simulate(address, messages, memo);
        let gasAmount = gasEstimated * 1.5;
        let gasPayment = (gasAmount * gasPrice).toFixed(0).toString();

        return {
            amount: coins(gasPayment, gasDenom),
            gas: gasAmount.toFixed(0)
        };

    } catch (e) {
        console.error("failed to get gas", e);
        return {
            amount: coins(80000, getMinDenom()),
            gas: "800000"
        }
    }
}

export const useTx = (chainName?: string) => {
    const {address, getOfflineSignerAmino, getOfflineSignerDirect, chain} = useChain(chainName ?? getChainName());
    const {toast} = useToast();

    const tx = async (msgs: Msg[], options: TxOptions) => {
        if (!address) {
            toast({
                type: 'error',
                title: 'Wallet not connected',
                description: 'Please connect the wallet',
            });
            return;
        }

        const offlineSignerFunc = () => {
            if (options.useDirectSign) {
                return getOfflineSignerDirect();
            }

            //use amino in order to allow Ledger signing
            return getOfflineSignerAmino();
        }

        let client: Awaited<ReturnType<typeof getSigningClient>>;

        let fee: StdFee;
        try {
            client = await getSigningClient(offlineSignerFunc(), chainName, options.isIbc);
            if (options?.fee) {
                fee = options.fee;
            } else {
                fee = await simulateFee(address, client, msgs, undefined, chain.fees?.fee_tokens[0]);
            }
        } catch (e: any) {
            console.error(e);
            toast({
                title: TxStatus.Failed,
                description: e?.message || 'An unexpected error has occured',
                type: 'error',
            });
            return;
        }

        let broadcastToastId: string | number;

        broadcastToastId = toast({
            title: TxStatus.Broadcasting,
            description: 'Waiting for transaction to be signed and included in block',
            type: 'loading',
            duration: 999999,
        });

        if (client) {
            await client
                .signAndBroadcast(address, msgs, fee, "app.getbze.com")
                .then((res: any) => {
                    if (isDeliverTxSuccess(res)) {
                        if (options.onSuccess) options.onSuccess(res);

                        toast({
                            title: options.toast?.title || TxStatus.Successful,
                            type: options.toast?.type || 'success',
                            description: options.toast?.description,
                            duration: 10000,
                        });
                    } else {
                        toast({
                            title: TxStatus.Failed,
                            description: prettyError(res?.rawLog),
                            type: 'error',
                            duration: 10000,
                        });
                    }
                })
                .catch((err) => {
                    console.log(err);
                    toast({
                        title: TxStatus.Failed,
                        description: prettyError(err?.message),
                        type: 'error',
                        duration: 10000,
                    });
                })
                .finally(() => toast.close(broadcastToastId));
        } else {
            toast.close(broadcastToastId);
        }
    };

    return {tx};
};
