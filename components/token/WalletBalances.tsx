import {memo, useEffect, useMemo, useState} from "react";
import {getTokenDisplayDenom, isIBCType, isNativeType, Token} from "@/services";
import {DefaultBorderedBox} from "@/components";
import {Box, Text} from "@interchain-ui/react";
import {CoinSDKType} from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";
import {getChainName, prettyChainName, toUpperFirstLetter, uAmountToAmount} from "@/utils";
import {DenomUnitSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import {getAddressBalances, getAddressCounterpartyBalances} from "@/services/data_provider/Balances";
import {useChain} from "@cosmos-kit/react";
import {getAddress} from "ethers/lib/utils";

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

    const {address} = useChain(getChainName());
    const getCounterpartyChainName = useMemo(() => {
        if (isIBCType(props.token.metadata.base)) {
            return props.token.ibcTrace?.counterparty.chain_name ?? getChainName();
        }

        if (isNativeType(props.token.metadata.base)) {
            //for BZE we want to display the balance on osmosis too
            return "osmosis";
        }

        return getChainName();
    }, [props.token]);

    const {address: counterpartyAddress} = useChain(getCounterpartyChainName);

    const loadData = async () => {
        if (!props.token || !address || !counterpartyAddress) {
            return;
        }

        const display = await getTokenDisplayDenom(props.token.metadata.base, props.token);
        setTokenDisplay(display);

        const bzeBalances = (await getAddressBalances(address)).balances.find((item) => item.denom === props.token.metadata.base);
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
            let chainName = "osmosis";
            if (counterpartyBalances) {
                if (isIBCType(props.token.metadata.base) && props.token.ibcTrace) {
                    chainName = props.token.ibcTrace.counterparty.chain_name;
                }

                allBalances.push({
                    balance: counterpartyBalances,
                    chainName: chainName,
                })
            }
        }

        setBalances(allBalances);

        setLoading(false);
    }

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props]);

    return (
        <DefaultBorderedBox mb='$12'>
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
                </Box>
            }

        </DefaultBorderedBox>
    );
});

WalletBalances.displayName = 'WalletBalances';