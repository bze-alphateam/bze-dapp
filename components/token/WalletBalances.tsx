import {memo, useCallback, useEffect, useMemo, useState} from "react";
import {getTokenDisplayDenom, isNativeType, Token} from "@/services";
import {DefaultBorderedBox} from "@/components";
import {Box, Button, Text} from "@interchain-ui/react";
import {CoinSDKType} from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";
import {getChainName, prettyChainName, toUpperFirstLetter, uAmountToAmount} from "@/utils";
import {DenomUnitSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import {
    getAddressBalances,
    getAddressCounterpartyBalances,
    removeBalancesCache
} from "@/services/data_provider/Balances";
import {useChain} from "@cosmos-kit/react";
import AddressBalanceListener from "@/services/listener/BalanceListener";
import TransferIbcAssetModal, {
    IBC_ACTION_WITHDRAW,
    IBC_ACTION_DEPOSIT,
    TransferIbcAssetModalProps
} from "@/components/wallet/TransferIbcAssetModal";
import {useDisclosure} from "@/hooks";

interface WalletBalancesProps {
    token: Token;
}

interface WalletBalance {
    balance: CoinSDKType;
    chainName: string;
}

export const WalletBalances = memo(({props}: { props: WalletBalancesProps }) => {
    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState<WalletBalance[]>([]);
    const [tokenDisplay, setTokenDisplay] = useState<DenomUnitSDKType|undefined>(undefined);
    const [modalProps, setModalProps] = useState<TransferIbcAssetModalProps>();

    const {address} = useChain(getChainName());
    const getCounterpartyChainName = useMemo(() => {
        return props.token.ibcTrace?.counterparty.chain_name ?? getChainName()
    }, [props.token]);

    const {address: counterpartyAddress} = useChain(getCounterpartyChainName);
    const ibcModalDisclosure = useDisclosure();

    const openModal = async (action: string) => {
        if (!tokenDisplay) {
            return;
        }

        const newProps = {
            control: ibcModalDisclosure,
            token: props.token,
            tokenDisplayDenom: tokenDisplay,
            action: action,
            onSuccess: async () => {
                if (action === IBC_ACTION_WITHDRAW && address) {
                    await removeBalancesCache(address);
                }

                loadData();
            },
        }

        setModalProps(newProps);
        newProps.control.onOpen();
    }

    const getModalActionButtonLabel = (action: string) => {
        if (!props.token || !address || !counterpartyAddress) {
            return "";
        }

        if (!isNativeType(props.token.metadata.base)) {
            return toUpperFirstLetter(action);
        }

        if (action === IBC_ACTION_DEPOSIT) {
            return "Deposit from Osmosis";
        }

        return "Withdraw to Osmosis";
    }

    const loadData = async () => {
        if (!props.token || !address || !counterpartyAddress) {
            return;
        }

        const display = await getTokenDisplayDenom(props.token.metadata.base, props.token);
        setTokenDisplay(display);

        const bzeBalances = (await getAddressBalances(address)).balances.find((item) => item.denom === props.token.metadata.base);
        console.log("bzeBalances", bzeBalances)
        const allBalances = [];
        if (bzeBalances) {
            allBalances.push({
                balance: bzeBalances,
                chainName: "beezee",
            });
        }

        if (address !== counterpartyAddress) {
            //when BZE is the token we want to fetch the BZE balance on Osmosis
            const counterpartyBalances = (await getAddressCounterpartyBalances(counterpartyAddress, props.token)).find((item) => item.denom === props.token.metadata.base)
            if (counterpartyBalances) {
                console.log("counterpartyBalances", counterpartyBalances)
                allBalances.push({
                    balance: counterpartyBalances,
                    chainName: getCounterpartyChainName,
                })
            }
        }

        setBalances(allBalances);

        setLoading(false);
    }

    const unpackBalances = useCallback(() => {
        if (!balances || balances.length === 0) {
            return [];
        }

        const all: CoinSDKType[] = [];
        balances.map((b) => {
            all.push(b.balance)
        })

        return all;
    }, [balances]);

    useEffect(() => {
        if (!props.token.metadata.base || props.token.metadata.base === "") {
            return;
        }

        const startBalanceInterval = () => {
            return setInterval(() => {
                loadData();
            }, 30 * 1000)
        }
        //fetch balances periodically
        let interval = startBalanceInterval();

        if (address !== undefined) {
            loadData();
            AddressBalanceListener.clearCallbacks();
            AddressBalanceListener.setAddress(address);
            AddressBalanceListener.addOnSendAndReceiveCallback(async () => {
                //restart the interval fetching the balances periodically
                clearInterval(interval);
                interval = startBalanceInterval();

                //force to always fetch the latest balances
                await removeBalancesCache(address);
                loadData();
            });
            AddressBalanceListener.start();
        } else {
            AddressBalanceListener.stop();
            clearInterval(interval);
        }
        return () => {
            AddressBalanceListener.stop();
            clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props, address]);

    return (
        <DefaultBorderedBox mb={{desktop: '$0', mobile: '$12'}}>
            {modalProps && <TransferIbcAssetModal props={{
                control: ibcModalDisclosure,
                action: modalProps.action,
                onSuccess: modalProps.onSuccess,
                token: modalProps.token,
                tokenDisplayDenom: modalProps.tokenDisplayDenom,
                bzeBalances: unpackBalances(),
            }}/>}
            <Box p='$6' mb='$2'>
                <Text as='h4' fontSize={'$md'} textAlign={'center'} color={'$primary200'}>Your {props.token.metadata.display.toUpperCase()} balances</Text>
            </Box>
            {loading &&
                <Box p={"$6"} m={"$2"}  justifyContent={"center"} textAlign={"center"}>
                    <Text>Loading balances</Text>
                </Box>
            }
            {!loading && balances.length === 0 &&
                <Box p={"$6"} m={"$2"}  justifyContent={"center"} textAlign={"center"}>
                    <Text>No balances found</Text>
                </Box>
            }
            {!loading && tokenDisplay && balances.length > 0 &&
                <Box p={"$6"} m={"$2"} justifyContent={"space-between"}>
                    {balances.map((item, index) => (
                        <Box mb={"$6"} key={item.chainName} flex={1} display={'flex'} justifyContent={'space-between'} flexDirection={"row"}>
                            <Box justifyContent={'flex-start'}>
                                <Text fontWeight={"$semibold"}>On {prettyChainName(item.chainName)}: </Text>
                            </Box>
                            <Box justifyContent={'flex-end'}>
                                <Text fontWeight={"$hairline"}>{uAmountToAmount(item.balance.amount, tokenDisplay.exponent)} {tokenDisplay.denom.toUpperCase()}</Text>
                            </Box>
                        </Box>
                    ))}
                    {counterpartyAddress && address && address !== counterpartyAddress &&
                        <Box display={'flex'} flexDirection={'row'} justifyContent={"center"} alignItems={"center"}>
                            <Box p={"$2"}>
                                <Button
                                    intent="text"
                                    size="sm"
                                    onClick={(event) => {openModal(IBC_ACTION_DEPOSIT)}}
                                    leftIcon={'plusRound'}
                                >
                                    {getModalActionButtonLabel(IBC_ACTION_DEPOSIT)}
                                </Button>
                            </Box>
                            <Button
                                intent="text"
                                size="sm"
                                onClick={(event) => {openModal(IBC_ACTION_WITHDRAW)}}
                                leftIcon={'minusRound'}
                            >
                                {getModalActionButtonLabel(IBC_ACTION_WITHDRAW)}
                            </Button>
                        </Box>
                    }
                </Box>
            }

        </DefaultBorderedBox>
    );
});

WalletBalances.displayName = 'WalletBalances';