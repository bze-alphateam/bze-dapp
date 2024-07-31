import { UseDisclosureReturn, useToast, useTx } from "@/hooks";
import { BasicModal, Box, TextField, Button, Callout, Text } from "@interchain-ui/react";
import { Token } from "@/services";
import { useEffect, useMemo, useState } from "react";
import { DenomUnitSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import { amountToUAmount, getChainName, toUpperFirstLetter } from "@/utils";
import BigNumber from "bignumber.js";
import { ibc } from '@bze/bzejs';
import Long from 'long';
import { coin, coins } from '@cosmjs/stargate';
import { useChain, useWallet } from "@cosmos-kit/react";

export const IBC_ACTION_WITHDRAW = 'withdraw';
export const IBC_ACTION_DEPOSIT = 'deposit';

const { transfer } = ibc.applications.transfer.v1.MessageComposer.withTypeUrl;

const getIbcTransferTimeout = (): Long => {
  return Long.fromNumber(Date.now() + 600_000).multiply(1_000_000)
}

export interface TransferIbcAssetModalProps {
  control: UseDisclosureReturn;
  token: Token;
  tokenDisplayDenom: DenomUnitSDKType;
  action: string;
  onClick: (token: Token) => void;
}

export default function TransferIbcAssetModal({props}: {props: TransferIbcAssetModalProps}) { 
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { tx: depositTx } = useTx(props.token.ibcTrace?.counterparty.chain_name);
  const { tx: withdrawTx} = useTx();
  const { address: bzeAddress } = useChain(getChainName());
  const { address: tokenChainAddress } = useChain(props.token.ibcTrace?.counterparty.chain_name ?? "");
  const { toast } = useToast();

  const onIncompleteIbcTradeData = () => {
    toast({
      type: 'error',
      title: 'This asset can not be deposited/withdrawn due to incomplete chain registry data',
    });
  }

  const onMissingAddresses = () => {
    toast({
      type: 'error',
      title: 'Please connect your wallet and approve the usage of chains that you want to use.',
    });
  }

  const performWithdraw = async (uAmount: string) => {
    if (!props.token.ibcTrace) {
      return onIncompleteIbcTradeData();
    }
    const transferTimeout = getIbcTransferTimeout();

    let msg = transfer({
      sourcePort: "transfer",
      sourceChannel: props.token.ibcTrace.chain.channel_id,
      sender: bzeAddress ?? "",
      receiver: tokenChainAddress ?? "",
      timeoutTimestamp: transferTimeout,
      token: coin(uAmount, props.token.metadata.base)
    });

    await withdrawTx([msg], {
      toast: {
        description: 'Successfully sent deposit transaction'
      },
      onSuccess: async () => {
        setAmount("");
        props.control.onClose();
      }
    });
    setIsLoading(false);
  }

  const performDeposit = async (uAmount: string) => {
    if (!props.token.ibcTrace) {
      return onIncompleteIbcTradeData();
    }
    const transferTimeout = getIbcTransferTimeout();

    let msg = transfer({
      sourcePort: "transfer",
      sourceChannel: props.token.ibcTrace.counterparty.channel_id,
      sender: tokenChainAddress ?? "",
      receiver: bzeAddress ?? "",
      timeoutTimestamp: transferTimeout,
      token: coin(uAmount, props.token.ibcTrace.counterparty.base_denom)
    });
    console.log("msg", msg);
    await depositTx([msg], {
      toast: {
        description: 'Successfully sent deposit transaction'
      },
      onSuccess: async () => {
        setAmount("");
        props.control.onClose();
      }
    });
    setIsLoading(false);
  }

  const onPressClick = () => {
    if (!props.token.ibcTrace) {
    
      return onIncompleteIbcTradeData();
    }

    if (!bzeAddress && !tokenChainAddress) {
      
      return onMissingAddresses();
    } 

    const amountNum = new BigNumber(amount);
    if (amountNum.isNaN() || amountNum.lte(0)) {
      toast({
        type: 'error',
        title: 'Please provide a valid amount',
      });

      return;
    }

    setIsLoading(true);
    const uAmount = amountToUAmount(amount, props.tokenDisplayDenom.exponent);
    if (props.action === IBC_ACTION_WITHDRAW) {
      return performWithdraw(uAmount);
    }

    return performDeposit(uAmount);
  }

  const onClose = () => {
    setAmount("");
    props.control.onClose();
  }

  const informationText = useMemo(() => {
    if (props.action === IBC_ACTION_WITHDRAW) {
      return `This action will withdraw ${props.tokenDisplayDenom.denom.toUpperCase()} coins from BeeZee blockchain to ${toUpperFirstLetter(props.token.ibcTrace?.counterparty.chain_name ?? "")} via IBC.`;
    }

    return `This action will deposit ${props.tokenDisplayDenom.denom.toUpperCase()} coins to BeeZee blockchain via IBC.`;
  }, [props.action, props.tokenDisplayDenom, props.token]);

  return (
    <BasicModal
      onClose={onClose}
      title={`${toUpperFirstLetter(props.action)} ${props.tokenDisplayDenom.denom.toUpperCase()}`}
      isOpen={props.control.isOpen}
    >
      <Box display='flex' flexDirection='column' justifyContent={'center'}>
        <Box display='flex' flexDirection={'column'} p='$4' justifyContent={'center'}>
          <Callout
            attributes={{
              width: '$auto',
              marginTop: '$2'
            }}
            iconName="informationLine"
            intent="success"
            title="IBC Transfer"
          >
            {informationText}
        </Callout>
        </Box>
        <Box display='flex' flexDirection={'row'} p='$4' justifyContent={'space-evenly'} alignItems={'center'}>
          <TextField
            id="fund-burner-amount"
            type="text"
            inputMode="numeric"
            size="sm"
            onChange={(e) => {setAmount(e.target.value)}}
            placeholder={`${props.tokenDisplayDenom.denom.toUpperCase()} amount`}
            value={amount}
            intent={'default'}
            disabled={isLoading}
          />
          <Box><Button size="sm" intent="secondary" onClick={onClose} isLoading={isLoading}>Cancel</Button></Box>
          <Box><Button size="sm" intent="primary" onClick={onPressClick} isLoading={isLoading}>{toUpperFirstLetter(props.action)}</Button></Box>
        </Box>
      </Box>
    </BasicModal>
  )
}