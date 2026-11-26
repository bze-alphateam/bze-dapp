// import { cosmos } from 'interchain-query';
import {useChain} from '@cosmos-kit/react';
import {DeliverTxResponse, isDeliverTxSuccess, StdFee} from '@cosmjs/stargate';
import {type CustomToast, useToast} from './useToast';
import {getSigningClient} from '@/services';
import {getChainName, getMinDenom, hasMaxFillsRefund, prettyError, simulateFee} from '@/utils';

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
                // a failed simulation means the tx would fail on chain and burn the fee: show why and stop
                fee = await simulateFee(address, client, msgs, getMinDenom(), undefined, chain.fees?.fee_tokens[0]);
            }
        } catch (e: any) {
            console.error(e);
            toast({
                title: TxStatus.Failed,
                description: prettyError(e?.message) || 'An unexpected error has occured',
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

                        if (hasMaxFillsRefund(res?.events)) {
                            toast({
                                title: 'Order partially filled',
                                type: 'default',
                                description: 'Part of your order was refunded because it hit the fill limit; place the rest again.',
                                duration: 15000,
                            });
                            return;
                        }

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
                .catch((err: any) => {
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
