// import { cosmos } from 'interchain-query';
import { useChain, useWallet } from '@cosmos-kit/react';
import { coins, DeliverTxResponse, isDeliverTxSuccess, StdFee } from '@cosmjs/stargate';
import { useToast, type CustomToast } from './useToast';
import { CHAIN_NAME } from '@/config';
import { getSigningClient } from '@/services';
import { getMinDenom } from '@/utils';

interface Msg {
  typeUrl: string;
  value: any;
}

interface TxOptions {
  fee?: StdFee | null;
  toast?: Partial<CustomToast>;
  onSuccess?: (res: DeliverTxResponse) => void;
}

export enum TxStatus {
  Failed = 'Transaction Failed',
  Successful = 'Transaction Successful',
  Broadcasting = 'Transaction Broadcasting',
}

const simulateFee = async (address: string, signingClient: any, messages: any[], memo?: string|undefined): Promise<StdFee> => {
  try {
    const gasEstimated = await signingClient.simulate(address, messages, memo);
    let gasAmount = gasEstimated * 1.5;
    let gasPayment = (gasAmount * 0.1).toFixed(0).toString();
    
    return {
      amount: coins(gasPayment, getMinDenom()),
      gas: gasAmount.toFixed(0)
    };

  } catch(e) {
    console.error("failed to get gas", e);
    return {
      amount: coins(80000, getMinDenom()),
      gas: "800000"
    }
  }
}

export const useTx = () => {
  const { address, getOfflineSigner } = useChain(process.env.NEXT_PUBLIC_CHAIN_NAME ?? CHAIN_NAME);

  const { toast } = useToast();

  const tx = async (msgs: Msg[], options: TxOptions) => {
    if (!address) {
      toast({
        type: 'error',
        title: 'Wallet not connected',
        description: 'Please connect the wallet',
      });
      return;
    }

    let client: Awaited<ReturnType<typeof getSigningClient>>;

    let fee: StdFee;
    try {
      client = await getSigningClient(getOfflineSigner());
      if (options?.fee) {
        fee = options.fee;
      } else {
        fee = await simulateFee(address, client, msgs);
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
        .signAndBroadcast(address, msgs, fee, undefined)
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
              description: res?.rawLog,
              type: 'error',
              duration: 10000,
            });
          }
        })
        .catch((err) => {
          console.log(err);
          toast({
            title: TxStatus.Failed,
            description: err?.message,
            type: 'error',
            duration: 10000,
          });
        })
        .finally(() => toast.close(broadcastToastId));
    } else {
      toast.close(broadcastToastId);
    }
  };

  return { tx };
};
