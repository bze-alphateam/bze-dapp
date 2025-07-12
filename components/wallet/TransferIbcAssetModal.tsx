import {UseDisclosureReturn, useToast, useTx} from "@/hooks";
import {BasicModal, Box, Button, Callout, Text, TextField} from "@interchain-ui/react";
import {Token} from "@/services";
import {useEffect, useMemo, useState} from "react";
import {DenomUnitSDKType} from "interchain-query/cosmos/bank/v1beta1/bank";
import {
    amountToUAmount,
    getChainName,
    prettyChainName,
    sanitizeNumberInput,
    toUpperFirstLetter,
    uAmountToAmount
} from "@/utils";
import BigNumber from "bignumber.js";
import {ibc} from '@bze/bzejs';
import Long from 'long';
import {coin} from '@cosmjs/stargate';
import {useChain} from "@cosmos-kit/react";
import {CoinSDKType} from "interchain-query/cosmos/base/v1beta1/coin";
import {ClickableBox} from "@/components";
import {getAddressCounterpartyBalances} from "@/services/data_provider/Balances";

export const IBC_ACTION_WITHDRAW = 'withdraw';
export const IBC_ACTION_DEPOSIT = 'deposit';

const {transfer} = ibc.applications.transfer.v1.MessageComposer.withTypeUrl;

const getIbcTransferTimeout = (): Long => {
    return Long.fromNumber(Date.now() + 600_000).multiply(1_000_000)
}

export interface TransferIbcAssetModalProps {
    control: UseDisclosureReturn;
    token: Token;
    tokenDisplayDenom: DenomUnitSDKType;
    action: string;
    onSuccess: () => void;
    bzeBalances?: CoinSDKType[];
}

export default function TransferIbcAssetModal({props}: { props: TransferIbcAssetModalProps }) {
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [availableBalance, setAvailableBalance] = useState<CoinSDKType|undefined>();

    const {tx: depositTx} = useTx(props.token.ibcTrace?.counterparty.chain_name);
    const {tx: withdrawTx} = useTx();
    const {address: bzeAddress} = useChain(getChainName());
    const {address: tokenChainAddress} = useChain(props.token.ibcTrace?.counterparty.chain_name ?? "");
    const {toast} = useToast();

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
            timeoutTimestamp: BigInt(transferTimeout.toString()),
            token: coin(uAmount, props.token.metadata.base),
            //@ts-ignore
            timeoutHeight: undefined,
            memo: "",
            encoding: "",
            useAliasing: false
        });

        await withdrawTx([msg], {
            toast: {
                description: 'Successfully sent deposit transaction'
            },
            onSuccess: async () => {
                setAmount("");
                props.control.onClose();
                props.onSuccess();
            },
            isIbc: true
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
            timeoutTimestamp: BigInt(transferTimeout.toString()),
            token: coin(uAmount, props.token.ibcTrace.counterparty.base_denom),
            //@ts-ignore
            timeoutHeight: undefined,
            memo: "",
            encoding: "",
            useAliasing: false
        });
        await depositTx([msg], {
            toast: {
                description: 'Successfully sent deposit transaction'
            },
            onSuccess: async () => {
                setAmount("");
                props.control.onClose();
                props.onSuccess();
            },
            isIbc: true
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
            return `This action will withdraw ${props.tokenDisplayDenom.denom.toUpperCase()} coins from BeeZee blockchain to ${prettyChainName(props.token.ibcTrace?.counterparty.chain_name ?? "")} blockchain via IBC.`;
        }

        return `This action will deposit ${props.tokenDisplayDenom.denom.toUpperCase()} coins from ${prettyChainName(props.token.ibcTrace?.counterparty.chain_name ?? "")} blockchain to BeeZee blockchain via IBC.`;
    }, [props.action, props.tokenDisplayDenom, props.token]);

    const availableBalanceText = useMemo(() => {
        if (props.action === IBC_ACTION_DEPOSIT) {
            return `Available on ${prettyChainName(props.token.ibcTrace?.counterparty.chain_name ?? "")} blockchain`
        }

        return `Available on BeeZee blockchain`
    }, [props.action, props.token]);

    const getAvailableBalance = async () => {
        if (!props.token || !tokenChainAddress) {
            return;
        }

        if (props.action === IBC_ACTION_WITHDRAW) {
            setAvailableBalance(props.bzeBalances?.find((item) => item.denom === props.token.metadata.base))

            return;
        }

        return setAvailableBalance((await getAddressCounterpartyBalances(tokenChainAddress, props.token)).find((item) => item.denom === props.token.metadata.base));
    };

    useEffect(() => {
        setAvailableBalance(undefined);
        setIsLoading(true);
        getAvailableBalance().then(() => setIsLoading(false)).catch(() => setIsLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props, tokenChainAddress])

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
                <Box display='flex' flexDirection={'column'} p='$4' justifyContent={'space-evenly'} >
                    <TextField
                        id="fund-burner-amount"
                        type="text"
                        //@ts-ignore
                        inputMode="decimal"
                        size="sm"
                        onChange={(e) => {
                            setAmount(sanitizeNumberInput(e.target.value))
                        }}
                        placeholder={`${props.tokenDisplayDenom.denom.toUpperCase()} amount`}
                        value={amount}
                        intent={'default'}
                        disabled={isLoading}
                    />
                    {!isLoading && availableBalance &&
                        <Box p={"$2"} display={'flex'} flex={1} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} flexWrap={'wrap'}>
                            <Box>
                                <Text fontWeight={'$hairline'} fontSize={'$xs'}>{availableBalanceText}</Text>
                            </Box>
                            <ClickableBox onClick={() => setAmount(uAmountToAmount(availableBalance.amount, props.tokenDisplayDenom.exponent))}>
                                <Box>
                                    <Text fontWeight={'$hairline'} fontSize={'$xs'} color={'$primary100'}>{uAmountToAmount(availableBalance.amount, props.tokenDisplayDenom.exponent)} {props.tokenDisplayDenom.denom.toUpperCase()}</Text>
                                </Box>
                            </ClickableBox>
                        </Box>
                    }
                    {!isLoading && !availableBalance &&
                        <Box p={"$2"} display={'flex'} flex={1} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} flexWrap={'wrap'}>
                            <Box>
                                <Text fontWeight={'$hairline'} fontSize={'$xs'}>Available</Text>
                            </Box>
                            <Box>
                                <Text fontWeight={'$hairline'} fontSize={'$xs'} color={'$primary100'}>Unknown</Text>
                            </Box>
                        </Box>
                    }
                    <Box flex={1} display={"flex"} flexDirection={'row'} justifyContent={'space-evenly'} p={"$4"}>
                        <Box><Button size="sm" intent="secondary" onClick={onClose}
                                     isLoading={isLoading}>Cancel</Button>
                        </Box>
                        <Box><Button size="sm" intent="primary" onClick={onPressClick}
                                     isLoading={isLoading}>{toUpperFirstLetter(props.action)}</Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </BasicModal>
    )
}