import {Box, Divider, Text} from "@interchain-ui/react";
import {DefaultBorderedBox, Layout} from "@/components";
import {SearchInput} from "@/components/common/Input";
import AssetList from "@/components/common/AssetList";
import {useEffect, useState} from "react";
import {getAllSupplyTokens, getTokenDisplayDenom, isFactoryType, isIBCType, sortAssets, Token} from "@/services";
import {useRouter} from "next/router";
import {useChain} from "@cosmos-kit/react";
import {getChainName} from "@/utils";
import {CoinSDKType} from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";
import {getAddressBalances, removeBalancesCache} from "@/services/data_provider/Balances";
import AddressBalanceListener from "@/services/listener/BalanceListener";
import {useDisclosure} from "@/hooks";
import TransferIbcAssetModal, {TransferIbcAssetModalProps} from "@/components/wallet/TransferIbcAssetModal";

function TokenList() {
    const [loading, setLoading] = useState(true);
    const [list, setList] = useState<Map<string, Token>>(new Map());
    const [userBalances, setUserBalances] = useState<CoinSDKType[]>([]);
    const [filtered, setFiltered] = useState<Token[]>([]);
    const [modalProps, setModalProps] = useState<TransferIbcAssetModalProps>();

    const router = useRouter();
    const {address} = useChain(getChainName());
    const ibcModalDisclosure = useDisclosure();

    const openModal = async (selectedToken: Token, action: 'deposit' | 'withdraw') => {
        const newProps = {
            control: ibcModalDisclosure,
            token: selectedToken,
            tokenDisplayDenom: await getTokenDisplayDenom(selectedToken.metadata.base, selectedToken),
            action: action,
            onClick: () => {
            },
        }

        setModalProps(newProps);
        newProps.control.onOpen();
    }

    const handleSearch = (query: string) => {
        setLoading(true);
        if (query.length === 0) {
            setFiltered(sortAssets(Array.from(list.values())));
            setLoading(false);
            return;
        }

        let res: Token[] = [];
        query = query.toLowerCase();
        list.forEach((token, index) => {
            if (index.toLowerCase().includes(query)) {
                res.push(token);
                return;
            }

            if (token.metadata.display.toLowerCase().includes(query) || token.metadata.name.toLowerCase().includes(query) || token.metadata.symbol.toLowerCase().includes(query)) {
                res.push(token);
            }
        });

        setFiltered(sortAssets(res));
        setLoading(false);
    }

    const fetchBalances = async () => {
        if (address !== undefined) {
            const balances = await getAddressBalances(address);
            if (balances.balances.length > 0) {
                setUserBalances(balances.balances);
            }
        } else {
            setUserBalances([]);
        }
    }

    const fetchList = async () => {
        const tokens = await getAllSupplyTokens();

        setList(tokens);
        setFiltered(sortAssets(Array.from(tokens.values())));
        await fetchBalances();
        setLoading(false);
    }

    useEffect(() => {
        fetchList();
        if (address !== undefined) {
            fetchBalances();
            AddressBalanceListener.clearCallbacks();
            AddressBalanceListener.setAddress(address);
            AddressBalanceListener.addOnSendAndReceiveCallback(async () => {
                await removeBalancesCache(address);
                fetchBalances();
            });
            AddressBalanceListener.start();
        } else {
            AddressBalanceListener.stop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    useEffect(() => {
        const onRouteChange = () => {
            AddressBalanceListener.stop();
        };

        router.events.on('routeChangeStart', onRouteChange)

        // If the component is unmounted, unsubscribe
        // from the event with the `off` method:
        return () => {
            router.events.off('routeChangeStart', onRouteChange);
        }
    }, [router]);

    return (
        <DefaultBorderedBox
            ml='$6'
            mr={{desktop: '$0', mobile: '$6'}}
            mb='$6'
            flexDirection='column'
            width='$auto'
        >
            {modalProps && <TransferIbcAssetModal props={{
                control: ibcModalDisclosure,
                action: modalProps.action,
                onClick: modalProps.onClick,
                token: modalProps.token,
                tokenDisplayDenom: modalProps.tokenDisplayDenom,
                bzeBalances: userBalances,
            }}/>}
            <Box
                display='flex'
                flex={1}
                justifyContent={{desktop: 'space-between', mobile: 'center'}}
                flexDirection={{desktop: 'row', mobile: 'column'}}
                p='$2'
                m='$4'
                gap={'$2'}
            >
                <Box mt='$6'>
                    <Text fontSize={'$md'}>All Assets</Text>
                </Box>
                <SearchInput placeholder='Search asset' width={20} onSubmit={handleSearch}/>
            </Box>
            <Divider mb='$2'/>
            <Box display='flex' flexDirection={'column'} p='$2' m='$4'>
                {loading ?
                    <AssetList
                        list={[]}
                    /> :
                    <AssetList
                        balances={userBalances}
                        list={
                            filtered.map((token, i) => {
                                const showWithdraw = () => {
                                    return isIBCType(token.metadata.base) && token.ibcTrace !== undefined;
                                }

                                const onWithdraw = () => {
                                    if (!isIBCType(token.metadata.base)) {
                                        return;
                                    }

                                    openModal(token, "withdraw");
                                }

                                const showDeposit = () => {
                                    return isIBCType(token.metadata.base) && token.ibcTrace !== undefined;
                                }

                                const onDeposit = () => {
                                    if (!isIBCType(token.metadata.base)) {
                                        return;
                                    }

                                    openModal(token, "deposit");
                                }

                                return {
                                    token: token,
                                    onWithdraw: onWithdraw,
                                    showWithdraw: showWithdraw(),
                                    withdrawLabel: "Withdraw",
                                    showDeposit: showDeposit(),
                                    depositLabel: 'Deposit',
                                    onDeposit: onDeposit,
                                };
                            })
                        }
                    />
                }
            </Box>
        </DefaultBorderedBox>
    );
}

export default function Assets() {
    return (
        <Layout>
            <Box display='block' flexDirection={'row'}>
                <Box marginBottom={'$12'} ml='$6'>
                    <Text as="h1" fontSize={'$2xl'}>BZE Blockchain Assets</Text>
                </Box>
            </Box>
            <Box display='flex' flexDirection='column'>
                <TokenList/>
            </Box>
        </Layout>
    );
}
