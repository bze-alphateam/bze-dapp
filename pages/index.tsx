import {Box, Button, Callout, Divider, FieldLabel, Text} from "@interchain-ui/react";
import {DefaultBorderedBox, DexBanner, Layout, TooltippedText} from "@/components";
import {SearchInput} from "@/components/common/Input";
import {useEffect, useState} from "react";
import {
    getAllMarkets,
    getAllSupplyTokens,
    getAllTickers,
    getTradebinParams,
    removeAllMarketsCache,
    Ticker,
    Token
} from "@/services";
import {getChainName, marketIdFromDenoms, prettyFee, truncateDenom} from "@/utils";
import {useChain, useWallet} from "@cosmos-kit/react";
import {WalletStatus} from "cosmos-kit";
import WalletConnectCallout from "@/components/wallet/WalletCallout";
import {useToast} from "@/hooks/useToast";
import {useDisclosure, useTx} from "@/hooks";
import {bze} from '@bze/bzejs';
import {DeliverTxResponse} from "@cosmjs/stargate";
import {useRouter} from "next/router";
import SelectAssetModal from "@/components/wallet/SelectAssetModal";
import MarketsList from "@/components/common/MarketList";
import {MarketSDKType} from "@bze/bzejs/bze/tradebin/store";
import {EXCLUDED_MARKETS} from "@/config/verified";

function BuyWithSkip() {
    const handleClick = () => {
        const url = "https://go.skip.build/?src_chain=1&src_asset=ethereum-native&dest_chain=beezee-1&dest_asset=ubze";
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <DefaultBorderedBox flex={1}>
            <Box display={'flex'} flexDirection={'column'} alignItems='center'>
                <Box p='$6' mt='$6'>
                    <Text fontSize={'$lg'} fontWeight={'$bold'} color='$primary200'>Don&apos;t have BZE yet? No problem!</Text>
                </Box>
                <Box p='$6' mb='$6'>
                    <Text letterSpacing={'$wide'} fontSize={'$md'}>Buy your first BZE coins with assets from other blockchains like Binance Smart Chain, Ethereum, Avalanche, Polygon and more!
                        With just a few clicks, fast and secure!</Text>
                </Box>
            </Box>
            <Box display={'flex'} m='$6' justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
                <Button size="sm" intent="primary" onClick={handleClick}>Buy BZE with... Anything</Button>
            </Box>
        </DefaultBorderedBox>
    );
}


const {createMarket} = bze.tradebin.MessageComposer.withTypeUrl;

interface CreateMarketFormProps {
    onCancel: () => void,
    onSuccess?: (txResult: DeliverTxResponse) => void,
    fee: string,
}

function CreateMarketForm({props}: { props: CreateMarketFormProps }) {
    const [allTokens, setAllTokens] = useState<Token[]>([]);
    const [baseCoin, setBaseCoin] = useState<Token | undefined>();
    const [quoteCoin, setQuoteCoin] = useState<Token | undefined>();
    const [submitPending, setSubmitPending] = useState<boolean>(false);

    const {address} = useChain(getChainName());

    //modals state
    const baseDisclosure = useDisclosure();
    const quoteDisclosure = useDisclosure();

    const {toast} = useToast();
    const {tx} = useTx();

    const validate = (): boolean => {
        if (address === undefined) {
            toast({
                type: 'error',
                title: `No wallet connected`
            })

            return false;
        }

        if (baseCoin === undefined) {
            toast({
                type: 'error',
                title: `Please select base coin`
            })

            return false;
        }

        if (quoteCoin === undefined) {
            toast({
                type: 'error',
                title: `Please select quote coin`
            })

            return false;
        }

        return true;
    }

    const onSubmit = async () => {
        if (!validate() || baseCoin === undefined || quoteCoin === undefined || address === undefined) {
            return;
        }

        setSubmitPending(true);
        const msg = createMarket({
            base: baseCoin.metadata.base,
            quote: quoteCoin.metadata.base,
            creator: address,
        });

        await tx([msg], {
            toast: {
                description: 'Market successfully created!'
            },
            onSuccess: (res: DeliverTxResponse) => {
                props.onSuccess ? props.onSuccess(res) : null;
            },
        });

        setSubmitPending(false);
    }

    const onBaseDenomSelect = (token: Token) => {
        setBaseCoin(token);
        baseDisclosure.onClose();
    }

    const onQuoteDenomSelect = (token: Token) => {
        setQuoteCoin(token);
        quoteDisclosure.onClose();
    }

    useEffect(() => {
        const fetchTokens = async () => {
            const all = await getAllSupplyTokens();
            setAllTokens(Array.from(all.values()));
        }
        fetchTokens();
    }, []);

    return (
        <>
            <SelectAssetModal props={{control: baseDisclosure, onClick: onBaseDenomSelect, list: allTokens}}/>
            <SelectAssetModal props={{control: quoteDisclosure, onClick: onQuoteDenomSelect, list: allTokens}}/>
            <Box m='$6' width={'$full'}>
                <Box display={'flex'} flexDirection={'row'} flex={1} justifyContent={'space-evenly'}>
                    <Box p='$2'>
                        <FieldLabel htmlFor="base-denom" label={<TooltippedText text="Market coin"
                                                                                tooltip="The base coin is the first currency listed in a trading pair and is the asset being traded. For example, in the trading pair VDL/BZE, VDL is the base coin. When you create a market or place an order, you are either buying or selling this base coin (VDL) against the quote coin."/>}
                                    attributes={{marginBottom: '12px'}}></FieldLabel>
                        <Button intent="text" key={"base-denom"} disabled={submitPending} size='sm'
                                leftIcon={baseCoin === undefined ? "add" : undefined}
                                onClick={baseDisclosure.onOpen}>{baseCoin === undefined ? "Pick coin" : truncateDenom(baseCoin.metadata.name)}</Button>
                    </Box>
                    <Box p='$2'>
                        <FieldLabel htmlFor="quote-denom" label={<TooltippedText text="Quote coin"
                                                                                 tooltip="The quote coin is the second currency listed in a trading pair and is used to price the base coin. For instance, in the trading pair VDL/BZE, BZE is the quote coin. The price of the base coin (VDL) is expressed in terms of the quote coin (BZE). In other words, it shows how much of the quote coin is needed to purchase one unit of the base coin."/>}
                                    attributes={{marginBottom: '12px'}}></FieldLabel>
                        <Button intent="text" key={"quote-denom"} disabled={submitPending} size='sm'
                                leftIcon={quoteCoin === undefined ? "add" : undefined}
                                onClick={quoteDisclosure.onOpen}>{quoteCoin === undefined ? "Pick coin" : truncateDenom(quoteCoin.metadata.name)}</Button>
                    </Box>
                </Box>
                <Callout
                    attributes={{
                        width: '$auto',
                        marginTop: '$2'
                    }}
                    iconName="informationLine"
                    intent="warning"
                    title="Create Market fee"
                >
                    You will pay a fee of {props.fee} to create the market.
                </Callout>
                <Box display={'flex'} flexDirection={'row'} justifyContent={'space-evenly'} mt={'$12'}>
                    <Button size="sm" intent="secondary" onClick={props.onCancel}
                            disabled={submitPending}>Cancel</Button>
                    <Button size="sm" intent="primary" onClick={() => {
                        onSubmit()
                    }} disabled={submitPending} isLoading={submitPending}>Create</Button>
                </Box>
            </Box>
        </>
    );
}

interface CallToActionBoxProps {
    onMarketCreated: () => void
}

function CallToActionBox({props}: { props: CallToActionBoxProps }) {
    const [createMarketFee, setCreateMarketFee] = useState('Loading fee...');
    const [fee, setFee] = useState<string>("");
    const [showForm, setShowForm] = useState(false);
    const {status: walletStatus} = useWallet();

    const fetchParams = async () => {
        let params = await getTradebinParams();
        if (params === undefined) {
            setCreateMarketFee('Unknown');

            return;
        }

        //pretty fee
        let pFee = prettyFee(params.createMarketFee);
        setCreateMarketFee(`${pFee} Required`);
        setFee(pFee);
    }

    const onMarketCreated = (_: DeliverTxResponse) => {
        props.onMarketCreated ? props.onMarketCreated() : null
        setShowForm(false);
    }

    useEffect(() => {
        fetchParams();
    }, []);

    return (
        <Box flex={1} ml={{desktop: '$6', mobile: '$0'}} mb={{desktop: '$0', mobile: '$12'}}>
            <DefaultBorderedBox>
                <Box display={'flex'} flexDirection={'column'} alignItems='center'>
                    <Box p='$6' mt='$6'>
                        <Text fontSize={'$lg'} fontWeight={'$bold'} color='$primary200'>Create a trading market for your
                            tokens</Text>
                    </Box>
                    <Box p='$6' mb='$6'>
                        <Text letterSpacing={'$wide'} fontSize={'$md'}>Create your own trading market on our
                            decentralized exchange! With our orderbook style DEX, you have the power to create and
                            manage markets between any two assets, whether they&apos;re native coins, tokens, or IBC
                            assets.</Text>
                    </Box>
                </Box>
                <Box display={'flex'} m='$6' justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
                    {showForm && walletStatus === WalletStatus.Connected &&
                        <Box>
                            <CreateMarketForm props={{
                                fee: fee,
                                onCancel: () => {
                                    setShowForm(false)
                                },
                                onSuccess: onMarketCreated
                            }}/>
                        </Box>
                    }
                    {!showForm && walletStatus === WalletStatus.Connected &&
                        <>
                            <Button size="sm" intent="primary" onClick={() => setShowForm(true)}>Create Market</Button>
                            <Box mt='$6'><Text fontSize={'$sm'} fontWeight={'$hairline'}>{createMarketFee}</Text></Box>
                        </>
                    }
                    {walletStatus !== WalletStatus.Connected &&
                        <WalletConnectCallout props={{text: 'Please connect your wallet to create markets'}}/>
                    }
                </Box>
            </DefaultBorderedBox>
        </Box>
    );
}

interface MarketListProps {
    list: MarketSDKType[];
    tokens: Map<string, Token>;
    loading: boolean;
    tickers?: Map<string, Ticker>;
}

function MarketsListing(props: MarketListProps) {
    const [loading, setLoading] = useState(true);
    const [tokens, setTokens] = useState<Map<string, Token>>(new Map());
    const [list, setList] = useState<MarketSDKType[]>([]);
    const [filtered, setFiltered] = useState<MarketSDKType[]>([]);

    //filters
    const [onlyActive, setOnlyActive] = useState(false);
    const [onlyVerified, setOnlyVerified] = useState(false);
    const [query, setQuery] = useState("");

    const router = useRouter();

    const sortMarketsCallback = (a: MarketSDKType, b: MarketSDKType): number => {
        // Retrieve token data for both markets
        const aBaseToken = tokens.get(a.base);
        const aQuoteToken = tokens.get(a.quote);
        const bBaseToken = tokens.get(b.base);
        const bQuoteToken = tokens.get(b.quote);

        // If any token data is undefined, assume they are unverified
        const aVerified = aBaseToken?.verified && aQuoteToken?.verified;
        const bVerified = bBaseToken?.verified && bQuoteToken?.verified;

        //first verified, then unverified
        if (aVerified && !bVerified) {
            return -1;
        } else if (!aVerified && bVerified) {
            return 1;
        }

        const aTicker = props.tickers?.get(marketIdFromDenoms(a.base, a.quote));
        const bTicker = props.tickers?.get(marketIdFromDenoms(b.base, b.quote));
        if (aTicker && bTicker) {
            if (aQuoteToken?.stableCoin && !bQuoteToken?.stableCoin && aTicker.quote_volume > 0) {
                return -1;
            } else if (!aQuoteToken?.stableCoin && bQuoteToken?.stableCoin && bTicker.quote_volume) {
                return 1;
            }

            return bTicker.quote_volume - aTicker.quote_volume;
        }

        if (aTicker && bTicker === undefined) {
            return -1;
        } else if (aTicker === undefined && bTicker) {
            return 1;
        }

        return 0
    }

    const filterList = (marketsToFilter: MarketSDKType[], query: string, showOnlyActive: boolean, showOnlyVerified: boolean): MarketSDKType[] => {
        let res: MarketSDKType[] = [];
        query = query.toLowerCase();
        marketsToFilter.forEach((market) => {
            if (showOnlyActive) {
                const marketTicker = props.tickers?.get(marketIdFromDenoms(market.base, market.quote));
                if (marketTicker === undefined) {
                    return;
                }

                if (marketTicker.quote_volume === 0) {
                    return;
                }
            }

            if (showOnlyVerified) {
                const baseToken = tokens.get(market.base);
                const quoteToken = tokens.get(market.quote);
                if (baseToken === undefined || quoteToken === undefined) {
                    return;
                }

                if (!baseToken.verified || !quoteToken.verified) {
                    return;
                }
            }

            if (query.length === 0) {
                res.push(market);
                return;
            }

            if (market.base.toLowerCase().includes(query) || market.quote.toLowerCase().includes(query)) {
                res.push(market);
                return;
            }

            const baseToken = tokens.get(market.base);
            const quoteToken = tokens.get(market.quote);
            if (baseToken === undefined || quoteToken === undefined) {
                return;
            }

            if (baseToken.metadata.display.toLowerCase().includes(query) || baseToken.metadata.name.toLowerCase().includes(query) || baseToken.metadata.symbol.toLowerCase().includes(query)) {
                res.push(market);
            }

            if (quoteToken.metadata.display.toLowerCase().includes(query) || quoteToken.metadata.name.toLowerCase().includes(query) || quoteToken.metadata.symbol.toLowerCase().includes(query)) {
                res.push(market);
            }
        });

        return res;
    }

    const handleSearch = (query: string, showOnlyActive: boolean, showOnlyVerified: boolean) => {
        setLoading(true);
        setQuery(query);

        let res: MarketSDKType[] = filterList(list, query, showOnlyActive, showOnlyVerified);

        setFiltered(res);
        setLoading(false);
    }

    const filterButtonIntent = (active: boolean): "success" | "secondary" => {
        return active ? 'success' : 'secondary';
    }

    const toggleShowActive = () => {
        handleSearch(query, !onlyActive, onlyVerified);
        setOnlyActive(!onlyActive);
    }

    const toggleShowVerified = () => {
        handleSearch(query, onlyActive, !onlyVerified);
        setOnlyVerified(!onlyVerified);
    }

    useEffect(() => {
        setLoading(props.loading);
        setList(props.list);
        const filtered = filterList(props.list, query, onlyActive, onlyVerified);
        setFiltered(filtered);
        setTokens(props.tokens);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props]);

    return (
        <DefaultBorderedBox
            ml={{desktop: '$6', mobile: '$0'}}
            mb='$6'
            flexDirection='column'
            width={{desktop: '$auto', mobile: '$auto'}}
        >
            <Box
                display='flex'
                flex={1}
                justifyContent={{desktop: 'space-between', mobile: 'center'}}
                flexDirection={{desktop: 'row', mobile: 'column'}}
                p='$2'
                m='$4'
                gap={'$2'}
            >
                <Box>
                    <Text fontSize={'$md'}>Markets</Text>
                    <Box display={"flex"} flex={1} flexDirection={"row"} mt={"$4"} justifyContent={"space-between"}>
                        <Box><Button intent={filterButtonIntent(onlyVerified)} size={"xs"} onClick={toggleShowVerified}>Only
                            verified</Button></Box>
                        <Box width={"$2"}></Box>
                        <Box><Button intent={filterButtonIntent(onlyActive)} size={"xs"} onClick={toggleShowActive}>Only
                            active</Button></Box>
                    </Box>
                </Box>
                <Box>
                    <SearchInput placeholder='Search market' width={20}
                                 onSubmit={(query: string) => handleSearch(query, onlyActive, onlyVerified)}/>
                </Box>
            </Box>
            <Divider mb='$2'/>
            <Box display='flex' flexDirection={'column'} p='$2' m='$4'>
                {loading ?
                    <MarketsList
                        list={[]}
                    /> :
                    <MarketsList
                        tickers={props.tickers}
                        list={
                            filtered.sort(sortMarketsCallback).map((market) => {
                                return {
                                    onWithdraw: () => {
                                        router.push({
                                            pathname: '/trade/market',
                                            query: {
                                                base: market.base,
                                                quote: market.quote,
                                            }
                                        });
                                    },
                                    showWithdraw: true,
                                    withdrawLabel: "Trade",
                                    baseToken: tokens.get(market.base),
                                    quoteToken: tokens.get(market.quote),
                                };
                            })
                        }
                    />
                }
            </Box>
        </DefaultBorderedBox>
    );
}

export default function Home() {
    const [loading, setLoading] = useState(true);
    const [allTokens, setAllTokens] = useState<Map<string, Token>>(new Map());
    const [list, setList] = useState<MarketSDKType[]>([]);
    const [tickers, setTickers] = useState<Map<string, Ticker>>(new Map());

    const fetchList = async () => {
        const [resp, tokens, tick] = await Promise.all([getAllMarkets(), getAllSupplyTokens(), getAllTickers()]);
        setAllTokens(tokens);
        const filteredMarkets = resp.market.filter((market: MarketSDKType) => !EXCLUDED_MARKETS[marketIdFromDenoms(market.base, market.quote)]);
        setList(filteredMarkets);
        setTickers(tick);
        setLoading(false);
    }

    const reloadList = async () => {
        await removeAllMarketsCache();
        fetchList();
    }

    useEffect(() => {
        fetchList();
        const refreshInterval = setInterval(() => {
            fetchList();
        }, 60 * 1000);

        return () => {
            clearInterval(refreshInterval);
        }
    }, []);

    return (
        <Layout>
            <DexBanner url={"https://dex.getbze.com/exchange"}/>
            <Box display='block' flexDirection={'row'}>
                <Box marginBottom={'$12'} ml='$6'>
                    <Text as="h1" fontSize={'$2xl'}>Trade</Text>
                </Box>
            </Box>
            <Box display='flex' flexDirection={{desktop: 'column', mobile: 'column'}}>
                <MarketsListing loading={loading} list={list} tokens={allTokens} tickers={tickers}/>
                <Box flex={1} flexDirection={{desktop: "row", mobile: "column-reverse"}} display={'flex'} justifyContent={'center'} gap={'$6'} flexWrap={'wrap'}>
                    <CallToActionBox props={{onMarketCreated: reloadList}}/>
                    <BuyWithSkip/>
                </Box>
            </Box>
        </Layout>
    );
}
