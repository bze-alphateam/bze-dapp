import {Box, Button, Divider, Skeleton, Text} from "@interchain-ui/react";
import {DefaultBorderedBox, Layout} from "@/components";
import {useRouter} from "next/router";
import {memo, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
  CHART_1D,
  CHART_1Y,
  CHART_30D,
  CHART_4H,
  CHART_7D,
  getAddressHistory,
  getAddressMarketOrders,
  getAllSupplyTokens,
  getAllTickers,
  getChartIntervalsLimit,
  getChartMinutes,
  getMarketBuyOrders,
  getMarketHistory,
  getMarketSellOrders,
  getMarketUsdPrices,
  getNoOfIntervalsNeeded,
  getTokenDisplayDenom,
  getTradingViewIntervals,
  HistoryOrder,
  MarketPrices,
  Ticker,
  TradeViewChart,
} from "@/services";
import BigNumber from "bignumber.js";
import {
    addDebounce,
    addMultipleDebounce,
    getChainName,
    marketIdFromDenoms,
    prettyAmount,
    uPriceToBigNumberPrice,
} from "@/utils";
import {useChain} from "@cosmos-kit/react";
import {HistoryOrderSDKType, OrderReferenceSDKType} from "@bze/bzejs/types/codegen/beezee/tradebin/order";
import {
  ActiveOrders,
  ActiveOrdersList,
  ActiveOrdersProps,
  ChartComponent,
  MarketPairTokens,
  MyHistoryList,
  MyOrdersList,
  OrderHistoryList
} from "@/components/trade";
import {EmptyOrderFormData, OrderFormData, OrderForms} from "@/components/trade/OrderForms";
import {OrderCanceledEvent, OrderExecutedEvent, OrderSavedEvent} from "@bze/bzejs/types/codegen/beezee/tradebin/events";
import MarketPairListener from "@/services/listener/MarketPairListener";
import {PriceBox, StatsBox, VolumeBox} from "@/components/trade/StatsBox";


interface MarketChartProps {
    tokens: MarketPairTokens;
    chartType: string;
    onChartChange?: (chartType: string) => void;
    chartData: TradeViewChart[];
    loading: boolean;
    volume?: string;
}

const MarketChart = memo((props: MarketChartProps) => {
    const [chartId, setChartId] = useState<number>(0);

    const getChartButtonIntent = (buttonChartType: string) => {
        if (props.chartType === buttonChartType) {
            return "tertiary";
        }

        return "secondary";
    }

    const selectChart = (chartType: string) => {
        props.onChartChange ? props.onChartChange(chartType) : undefined;
    }

    useEffect(() => {
        setChartId(chartId + 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.chartData, props.chartType]);

    return (
        <DefaultBorderedBox
            width={{desktop: '$containerMd', mobile: '$auto'}}
            justifyContent={'center'}
            alignItems={'center'}
        >
            {!props.loading ?
                <Box
                    display={'flex'}
                    flexDirection={'column'}
                    justifyContent={'center'}
                    alignItems={'center'}
                    m={'$6'}
                >
                    <Box display={'flex'} flex={1} width={'$full'} flexDirection={{desktop: 'row', mobile: 'column'}}
                         gap={'$2'}>
                        <Box display={'flex'} flex={1} flexDirection={'row'} gap={'$2'}
                             justifyContent={{desktop: 'flex-start', mobile: 'center'}}>
                            <Text color={'$primary200'}>Volume: </Text>
                            <Text color={'$primary200'} fontWeight={'$bold'}>
                                {props.volume}
                            </Text>
                        </Box>
                        <Box display={'flex'} flex={1} flexDirection={'row'}
                             justifyContent={{desktop: 'flex-end', mobile: 'center'}} gap={'$2'}>
                            <Button intent={getChartButtonIntent(CHART_4H)} size="xs" onClick={() => {
                                selectChart(CHART_4H)
                            }}>{CHART_4H}</Button>
                            <Button intent={getChartButtonIntent(CHART_1D)} size="xs" onClick={() => {
                                selectChart(CHART_1D)
                            }}>{CHART_1D}</Button>
                            <Button intent={getChartButtonIntent(CHART_7D)} size="xs" onClick={() => {
                                selectChart(CHART_7D)
                            }}>{CHART_7D}</Button>
                            <Button intent={getChartButtonIntent(CHART_30D)} size="xs" onClick={() => {
                                selectChart(CHART_30D)
                            }}>{CHART_30D}</Button>
                            <Button intent={getChartButtonIntent(CHART_1Y)} size="xs" onClick={() => {
                                selectChart(CHART_1Y)
                            }}>{CHART_1Y}</Button>
                        </Box>
                    </Box>
                    <Box display={'flex'} flex={1} minWidth={300} minHeight={470}>
                        <ChartComponent
                            //@ts-ignore
                            priceData={props.chartData}
                            chartType={props.chartType}
                        ></ChartComponent>
                    </Box>
                </Box>
                :
                <Skeleton
                    display={'flex'}
                    flex={1}
                    borderRadius="$lg"
                    height="$full"
                    width="$full"
                />
            }
        </DefaultBorderedBox>
    );
});
MarketChart.displayName = 'MarketChart';

const ActiveOrdersSection = memo((props: ActiveOrdersProps) => {
    return (
        <DefaultBorderedBox p={'$2'} width={{desktop: '$auto', mobile: '$auto'}} minHeight={'50vh'} flex={1}>
            <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}>
                <Text as="h4">Order book</Text>
            </Box>
            <Divider my={'$2'}/>
            <Box>
                <ActiveOrdersList {...props}/>
            </Box>
        </DefaultBorderedBox>
    );
});
ActiveOrdersSection.displayName = 'ActiveOrdersSection';

interface OrderHistoryProps {
    tokens: MarketPairTokens;
    loading: boolean;
    orders: HistoryOrderSDKType[];
    userOrders: HistoryOrder[];
}

const OrderHistory = memo((props: OrderHistoryProps) => {
    const [intentHistory, setIntentHistory] = useState(true);

    return (
        <DefaultBorderedBox p={'$2'} width={{desktop: '$containerMd', mobile: '$auto'}} minHeight={'20vh'}>
            <Box display={'flex'} flex={1}>
                <Box display={'flex'} flex={1}><Button intent={intentHistory ? "tertiary" : "secondary"}
                                                       size={intentHistory ? "lg" : "sm"} fluid onClick={() => {
                    !intentHistory ? setIntentHistory(true) : null
                }} disabled={false}>Market history</Button></Box>
                <Box display={'flex'} flex={1}><Button intent={!intentHistory ? "tertiary" : "secondary"}
                                                       size={!intentHistory ? "lg" : "sm"} fluid onClick={() => {
                    intentHistory ? setIntentHistory(false) : null
                }} disabled={false}>My history</Button></Box>
            </Box>
            <Divider my={'$2'}/>
            {intentHistory ?
                <Box>
                    <OrderHistoryList {...props} />
                </Box>
                :
                <Box>
                    <MyHistoryList {...props} />
                </Box>
            }
        </DefaultBorderedBox>
    );
});
OrderHistory.displayName = 'OrderHistory';

interface MyOrdersProps {
    tokens: MarketPairTokens;
    loading: boolean;
    orders: OrderReferenceSDKType[];
    onOrderCancelled: () => void;
}

const MyOrders = memo((props: MyOrdersProps) => {
    return (
        <DefaultBorderedBox p={'$2'} minHeight={'20vh'} display={'flex'} flex={1} flexDirection={'column'}>
            <Box maxHeight={'$6'} display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}>
                <Text as="h4">My orders</Text>
            </Box>
            <Divider my={'$2'}/>
            <Box>
                <MyOrdersList {...props} />
            </Box>
        </DefaultBorderedBox>
    );
});
MyOrders.displayName = 'MyOrders';

export default function MarketPair() {
    const [marketId, setMarketId] = useState("");
    const [loading, setLoading] = useState(true);
    const [tokens, setTokens] = useState<MarketPairTokens>();
    const [chartData, setChartData] = useState<TradeViewChart[]>();
    const [chartType, setChartType] = useState(CHART_1D);
    const [marketPrices, setMarketPrices] = useState<MarketPrices | undefined>();
    const [ticker, setTicker] = useState<Ticker | undefined>();

    const [historyOrders, setHistoryOrders] = useState<HistoryOrderSDKType[]>();
    const [activeOrders, setActiveOrders] = useState<ActiveOrders>();
    const [myOrders, setMyOrders] = useState<OrderReferenceSDKType[]>();
    const [myHistory, setMyHistory] = useState<HistoryOrder[]>();

    const [orderFormData, setOrderFormData] = useState<OrderFormData>(EmptyOrderFormData);
    const chartTypeRef = useRef(chartType);

    const router = useRouter();
    const {query} = router;
    const {address} = useChain(getChainName());

    const loadMarketPrice = async () => {
        if (historyOrders?.length && tokens?.baseToken && tokens?.quoteToken) {
            const lastPrice = uPriceToBigNumberPrice(new BigNumber(historyOrders[0].price), tokens.quoteTokenDisplayDenom.exponent, tokens.baseTokenDisplayDenom.exponent);
            const prices = await getMarketUsdPrices(tokens.baseToken, tokens.quoteToken, lastPrice);
            setMarketPrices(prices);
        }
    }

    const loadChart = async () => {
        if (tokens === undefined) {
            return;
        }

        const chart = await getTradingViewIntervals(
            marketIdFromDenoms(tokens.baseToken.metadata.base, tokens.quoteToken.metadata.base),
            getChartMinutes(chartTypeRef.current),
            getChartIntervalsLimit(chartTypeRef.current),
        );

        setChartData(chart);
    }

    const fetchActiveOrders = async () => {
        if (!marketId) {
            return;
        }

        const [buy, sell] = await Promise.all([getMarketBuyOrders(marketId), getMarketSellOrders(marketId)]);

        setActiveOrders(
            {
                buyOrders: buy.list,
                sellOrders: sell.list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)),
            }
        );
    }

    const fetchMarketHistory = async () => {
        if (!marketId) {
            return;
        }
        const history = await getMarketHistory(marketId);
        setHistoryOrders(history.list);
    }

    const fetchMyOrders = async () => {
        if (!marketId) {
            return;
        }

        if (address === undefined) {
            setMyOrders([]);
            return;
        }

        const ord = await getAddressMarketOrders(marketId, address);
        setMyOrders(ord.list);
    }

    useEffect(() => {
        if (marketId === "") {
            return;
        }

        if (historyOrders === undefined) {
            fetchMarketHistory();
        }

        if (myOrders === undefined) {
            fetchMyOrders();
        }

        if (activeOrders === undefined) {
            fetchActiveOrders();
        }

        loadMarketPrice();
        //we're bouncing 2 times calls to aggregator, in case it is slow
        addMultipleDebounce("fetchTicker", 500, fetchTickers, 2);
        if (address) {
            addMultipleDebounce("fetchMyHistory", 500, () => fetchMyHistory(marketId, address), 2);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketId, historyOrders, myOrders, activeOrders]);

    const getTotalVolume = useMemo(() => {
        if (!chartData) {
            return "0";
        }

        let intervalsNeeded = getNoOfIntervalsNeeded(chartType);
        if (chartData.length < intervalsNeeded || intervalsNeeded === 0) {
            intervalsNeeded = chartData.length;
        }

        let vol = new BigNumber(0);
        for (let i = 0; i < intervalsNeeded; i++) {
            vol = vol.plus(chartData[chartData.length - 1 - i].value);
        }

        return vol.toString();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartData, chartType, historyOrders]);

    const fetchTickers = async () => {
        const data = await getAllTickers();
        setTicker(data.get(marketId));
    };
    const fetchMyHistory = async (marketId: string, address: string) => {
        const data = await getAddressHistory(address, marketId);
        setMyHistory(data);
    };
    const onOrderCancelled = useCallback(() => {
    }, []);
    const onChartChange = useCallback((ct: string) => setChartType(ct), []);
    const onOrderPlaced = useCallback(() => {
        setOrderFormData(EmptyOrderFormData)
    }, []);

    useEffect(() => {
        chartTypeRef.current = chartType;
        setChartData(undefined);
        loadChart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartType, tokens]);

    useEffect(() => {
        if (marketId === "") {
            return;
        }

        MarketPairListener.clearAllCallbacks();
        MarketPairListener.setMarketId(marketId);
        MarketPairListener.addOnOrderCanceledCallback((event: OrderCanceledEvent) => {
            fetchActiveOrders();
            fetchMyOrders();
        });
        MarketPairListener.addOnOrderExecutedCallback((event: OrderExecutedEvent) => {
            fetchActiveOrders();
            fetchMarketHistory();
            fetchMyOrders();
            addDebounce("chart-delayed", 1000, loadChart);
            loadMarketPrice();
        });
        MarketPairListener.addOnOrderSavedCallback((event: OrderSavedEvent) => {
            fetchActiveOrders();
            fetchMarketHistory();
            fetchMyOrders();
            loadChart();
        });
        MarketPairListener.start();

        fetchMyOrders();

        fetchTickers();
        if (address) {
            fetchMyHistory(marketId, address);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [marketId, address])

    useEffect(() => {
        const fetchTokens = async (base: string, quote: string) => {
            const allTokens = await getAllSupplyTokens();
            const baseToken = allTokens.get(base);
            const quoteToken = allTokens.get(quote);
            if (baseToken === undefined || quoteToken === undefined) {
                router.push({pathname: '/404'});
                return;
            }

            const baseDenomUnit = await getTokenDisplayDenom(baseToken.metadata.base, baseToken);
            const quoteDenomUnit = await getTokenDisplayDenom(quoteToken.metadata.base, quoteToken);
            setTokens({
                baseToken: baseToken,
                quoteToken: quoteToken,
                quoteTokenDisplayDenom: quoteDenomUnit,
                baseTokenDisplayDenom: baseDenomUnit,
            });

            setLoading(false);
        }

        if ((typeof query.base !== 'string') || (typeof query.quote !== 'string')) {
            return;
        }
        const mId = marketIdFromDenoms(query.base, query.quote);
        setMarketId(mId);

        fetchTokens(query.base, query.quote);
    }, [query, router]);

    //unsubscribe from WS when user navigates to another page
    useEffect(() => {
        const onRouteChange = () => {
            MarketPairListener.stop();
        };

        router.events.on('routeChangeStart', onRouteChange)

        // If the component is unmounted, unsubscribe
        // from the event with the `off` method:
        return () => {
            router.events.off('routeChangeStart', onRouteChange);
        }
    }, [router]);

    return (
        <Layout>
            <Box display='block' flexDirection={'row'}>
                <Box marginBottom={'$6'} ml='$6'>
                    <Box>
                        <Text as="h1" fontSize={'$2xl'}>DEX Market: <Text fontSize={'$2xl'} color={'$primary300'}
                                                                          as="span">{tokens?.baseToken.metadata.display.toUpperCase()}</Text><Text
                            fontSize={'$2xl'} color={'$primary300'}
                            as="span">/{tokens?.quoteToken.metadata.display.toUpperCase()}</Text></Text>
                    </Box>
                    <DefaultBorderedBox mb={"$6"} mt="$4" display='flex' flex={1} justifyContent={'center'} alignItems={'center'} flexDirection={"row"} mr={"$6"}>
                        <Box flex={1} display={"flex"} p={"$6"}>
                            <Text fontSize={'$xl'} fontWeight={'$bold'}>$FLIX - $USDC Trading Campaign 🚀</Text>
                        </Box>
                        <Box flex={1} display={"flex"} p={"$6"} flexDirection={"column"}>
                            <Text fontSize={'$md'} fontWeight={'$bold'}>💰 Rewards Pool: 400,000 $BZE + 2,000 $FLIX</Text>
                            <Text fontSize={'$md'} fontWeight={'$bold'}>📅 Duration: Jan 20, 2 PM UTC – Jan 25, 2 PM UTC</Text>
                        </Box>
                        <Box flex={1} display={"flex"} p={"$6"} justifyContent={"flex-end"}>
                            <Button size={"sm"} intent={"secondary"} rightIcon={"externalLinkLine"} onClick={() => window.open("https://x.com/FlixFanatics/status/1881332778144501943", "_blank", "noopener,noreferrer")}>Read More</Button>
                        </Box>
                    </DefaultBorderedBox>
                    <Box display="flex" flexDirection={{desktop: "row", mdMobile: "row", mobile: "column"}} gap="$4"
                         mt="$4">
                        <PriceBox price={ticker ? ticker.last_price : 0} change={ticker ? ticker.change : 0}
                                  denom={tokens?.quoteTokenDisplayDenom.denom ?? ""} marketPrice={marketPrices}/>
                        <VolumeBox title="24h Volume"
                                   marketPrice={marketPrices} ticker={ticker} tokens={tokens} />
                        <StatsBox title="24h High" value={ticker ? ticker.high : "0"}
                                  denom={tokens?.quoteTokenDisplayDenom.denom ?? ""} marketPrice={marketPrices}/>
                        <StatsBox title="24h Low" value={ticker ? ticker?.low : "0"}
                                  denom={tokens?.quoteTokenDisplayDenom.denom ?? ""} marketPrice={marketPrices}/>
                    </Box>
                </Box>
            </Box>
            <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column'}} mx='$6'>
                {!loading && tokens !== undefined &&
                    <Box display='flex' flex={1} flexDirection={'column'}>
                        <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column'}} flex={1} gap={'$6'}>
                            <MarketChart
                                chartType={chartType}
                                chartData={chartData !== undefined ? chartData : []}
                                loading={chartData === undefined}
                                tokens={tokens}
                                onChartChange={onChartChange}
                                volume={`${prettyAmount(getTotalVolume)} ${tokens.baseTokenDisplayDenom.denom.toUpperCase()}`}
                            />
                            <ActiveOrdersSection
                                tokens={tokens}
                                loading={activeOrders === undefined}
                                orders={activeOrders !== undefined ? activeOrders : {buyOrders: [], sellOrders: []}}
                                lastOrder={historyOrders !== undefined ? historyOrders[0] : undefined}
                                onOrderClick={setOrderFormData}
                            />
                        </Box>
                        <Box mt={'$6'} display='flex' flexDirection={{desktop: 'row', mobile: 'column-reverse'}}
                             flex={1} gap={'$6'}>
                            <OrderHistory
                                tokens={tokens}
                                loading={historyOrders === undefined}
                                orders={historyOrders !== undefined ? historyOrders : []}
                                userOrders={myHistory !== undefined ? myHistory : []}
                            />
                            <OrderForms
                                data={orderFormData}
                                tokens={tokens}
                                onOrderPlaced={onOrderPlaced}
                                activeOrders={activeOrders !== undefined ? activeOrders : {
                                    buyOrders: [],
                                    sellOrders: []
                                }}
                                loading={activeOrders === undefined}
                                marketPrices={marketPrices}
                            />
                        </Box>
                        <Box mt={'$6'} display='flex' flex={1} gap={'$6'}>
                            <MyOrders
                                tokens={tokens}
                                loading={myOrders === undefined}
                                orders={myOrders !== undefined ? myOrders : []}
                                onOrderCancelled={onOrderCancelled}
                            />
                        </Box>
                    </Box>
                }
            </Box>
        </Layout>
    );
}