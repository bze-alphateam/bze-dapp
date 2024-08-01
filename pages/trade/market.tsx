import { Box, Button, Divider, Icon, Skeleton, Text } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { useRouter } from "next/router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CHART_1D, CHART_1H, CHART_30D, CHART_7D, ChartPoint, MarketPrices, formatUsdAmount, getAddressMarketOrders, getAllSupplyTokens, getMarketBuyOrders, getMarketChart, getMarketHistory, getMarketSellOrders, getMarketUsdPrices, getTokenDisplayDenom } from "@/services";
import BigNumber from "bignumber.js";
import {getChainName, marketIdFromDenoms, uAmountToAmount, uPriceToBigNumberPrice, uPriceToPrice } from "@/utils";
import { useChain } from "@cosmos-kit/react";
import { HistoryOrderSDKType, OrderReferenceSDKType } from "@bze/bzejs/types/codegen/beezee/tradebin/order";
import { ActiveOrders, ActiveOrdersList, ActiveOrdersProps, MarketPairTokens, MyOrdersList, OrderHistoryList } from "@/components/trade";
import { EmptyOrderFormData, OrderFormData, OrderForms } from "@/components/trade/OrderForms";
import Chart from "@/components/trade/Chart";
import { OrderCanceledEvent, OrderExecutedEvent, OrderSavedEvent } from "@bze/bzejs/types/codegen/beezee/tradebin/events";
import MarketPairListener from "@/services/listener/MarketPairListener";

interface MarketChartProps {
  tokens: MarketPairTokens;
  chartType: string;
  onChartChange?: (chartType: string) => void;
  chartData: ChartPoint[];
  loading: boolean;
}

const MarketChart = memo((props: MarketChartProps) =>  {
  const [chartId, setChartId] = useState<number>(0);

  const getChartButtonIntent = (buttonChartType: string) => {
    if (props.chartType === buttonChartType) {
      return "tertiary";
    }

    return "secondary";
  }

  const selectChart = (chartType: string) => {
    props.onChartChange ? props.onChartChange(chartType): undefined;
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
          <Box display={'flex'} width={'$full'} flex={1} flexDirection={'row'} justifyContent={'flex-end'} gap={'$2'}>
            <Button intent={getChartButtonIntent(CHART_1H)} size="xs" onClick={() => {selectChart(CHART_1H)}}>{CHART_1H}</Button>
            <Button intent={getChartButtonIntent(CHART_1D)} size="xs" onClick={() => {selectChart(CHART_1D)}}>{CHART_1D}</Button>
            <Button intent={getChartButtonIntent(CHART_7D)} size="xs" onClick={() => {selectChart(CHART_7D)}}>{CHART_7D}</Button>
            <Button intent={getChartButtonIntent(CHART_30D)} size="xs" onClick={() => {selectChart(CHART_30D)}}>{CHART_30D}</Button>
          </Box>
          <Box display={'flex'} flex={1}>
            <Chart 
              key={chartId}
              height={500} 
              width={window.innerWidth > 769 ? 700 : 350} 
              margin={{
                top: 20,
                left: 0,
                bottom: 10,
                right: 0,
              }}
              chartData={props.chartData}
              quoteTokenDisplayDenom={props.tokens.quoteTokenDisplayDenom}
            />
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
}

const OrderHistory = memo((props: OrderHistoryProps) => {  
  return (
    <DefaultBorderedBox p={'$2'} width={{desktop: '$containerMd', mobile: '$auto'}} minHeight={'20vh'} >
      <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'} >
        <Text as="h4">History</Text>
      </Box>
      <Divider my={'$2'}/>
      <Box>
        <OrderHistoryList {...props} />
      </Box>
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
      <Box maxHeight={'$6'} display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'} >
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
  const [chartData, setChartData] = useState<ChartPoint[]>();
  const [chartType, setChartType] = useState(CHART_30D);
  const [marketPrices, setMarketPrices] = useState<MarketPrices|undefined>();

  const [historyOrders, setHistoryOrders] = useState<HistoryOrderSDKType[]>();
  const [activeOrders, setActiveOrders] = useState<ActiveOrders>();
  const [myOrders, setMyOrders] = useState<OrderReferenceSDKType[]>();

  const [orderFormData, setOrderFormData] = useState<OrderFormData>(EmptyOrderFormData);

  const router = useRouter();
  const { query } = router;
  const { address } = useChain(getChainName());

  const loadMarketPrice = async () => {
    if (historyOrders?.length && tokens?.baseToken && tokens?.quoteToken) {
      console.log("loadMarketPrice");
      const lastPrice = uPriceToBigNumberPrice(new BigNumber(historyOrders[0].price), tokens.quoteTokenDisplayDenom.exponent, tokens.baseTokenDisplayDenom.exponent);
      const prices = await getMarketUsdPrices(tokens.baseToken, tokens.quoteToken, lastPrice);
      setMarketPrices(prices);
    }
  }

  const loadChart = async () => {
    if (tokens === undefined) {
      return;
    }

    const chart = await getMarketChart(
      marketIdFromDenoms(tokens.baseToken.metadata.base, tokens.quoteToken.metadata.base),
      chartType,
      tokens.quoteTokenDisplayDenom.exponent,
      tokens.baseTokenDisplayDenom.exponent
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId, historyOrders, myOrders, activeOrders]);

  const getTotalVolume = useMemo(() => {
    if (chartData === undefined) {
      return "0";
    }
    
    let vol = new BigNumber(0);
    for (let i = 0; i < chartData.length; i++) {
      vol = vol.plus(chartData[i].volume);
    }

    return vol.toString();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, chartType, historyOrders]);

  const onOrderCancelled = useCallback(() => {}, []);
  const onChartChange = useCallback((chartType: string) => setChartType(chartType), []);
  const onOrderPlaced = useCallback(() => {
    setOrderFormData(EmptyOrderFormData)
  }, []);

  useEffect(() => {
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
      loadChart();
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
          <Box><Text as="h1" fontSize={'$2xl'}>DEX Market: <Text fontSize={'$2xl'} color={'$primary300'} as="span">{tokens?.baseToken.metadata.display}</Text><Text fontSize={'$2xl'} color={'$primary300'} as="span">/{tokens?.quoteToken.metadata.display}</Text></Text></Box>
          {historyOrders !== undefined && tokens !== undefined &&
            <Box display={'flex'} flexDirection={'row'} alignItems={'center'} mt={'$2'} gap={'$2'}>
              {
                historyOrders.length > 0 && 
                <>
                  <Text color={'$primary200'}>Last price: </Text>
                  <Text color={historyOrders[0].order_type === 'sell' ? '$green200' : '$red300'} fontWeight={'$bold'}>
                    {uPriceToPrice(new BigNumber(historyOrders[0].price), tokens.quoteTokenDisplayDenom.exponent, tokens.baseTokenDisplayDenom.exponent)} {tokens.quoteTokenDisplayDenom.denom}
                  </Text>
                  {
                    marketPrices && 
                    marketPrices.base.gt(0) &&
                    marketPrices.denom !== tokens.quoteTokenDisplayDenom.denom && 
                    marketPrices.denom !== tokens.baseTokenDisplayDenom.denom &&
                    <Text color={historyOrders[0].order_type === 'sell' ? '$green200' : '$red300'} fontSize={'$xs'} fontWeight={'$semibold'}>
                     ({formatUsdAmount(marketPrices.base)} {marketPrices.denom})
                    </Text>
                  }
                  <Text color={historyOrders[0].order_type === 'sell' ? '$green200' : '$red300'} fontWeight={'$bold'}>
                     {historyOrders[0].order_type === 'sell' ? <Icon name="arrowUpS"/> : <Icon name="arrowDownS"/>}
                  </Text>
                </>
              }
            </Box>
          }
          {chartData !== undefined && tokens !== undefined &&
            <Box display={'flex'} flexDirection={'row'} alignItems={'center'} mt={'$2'} gap={'$2'}>
              <Text color={'$primary200'}>{chartType} volume: </Text>
              <Text color={'$primary200'} fontWeight={'$bold'}>
                {uAmountToAmount(getTotalVolume, tokens.baseTokenDisplayDenom.exponent)} {tokens.baseTokenDisplayDenom.denom}
              </Text>
              {
                marketPrices && 
                marketPrices.quote.gt(0) &&
                new BigNumber(getTotalVolume).gt(0) &&
                marketPrices.denom !== tokens.baseTokenDisplayDenom.denom &&
                <Text color={'$primary200'} fontSize={'$xs'} fontWeight={'$semibold'}>
                  ({formatUsdAmount(marketPrices.base.multipliedBy(uAmountToAmount(getTotalVolume, tokens.baseTokenDisplayDenom.exponent)))} {marketPrices.denom})
                </Text>
              }
            </Box>
          }
        </Box>
      </Box >
      <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column'}}  mx='$6'>
        {!loading && tokens !== undefined &&
          <Box display='flex' flex={1} flexDirection={'column'}>
            <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column'}} flex={1} gap={'$6'}>
              <MarketChart
                chartType={chartType}
                chartData={chartData !== undefined ? chartData : []}
                loading={chartData === undefined}
                tokens={tokens}
                onChartChange={onChartChange}
              />
              <ActiveOrdersSection 
                tokens={tokens}
                loading={activeOrders === undefined}
                orders={activeOrders !== undefined ? activeOrders : {buyOrders: [], sellOrders:[]}}
                lastOrder={historyOrders !== undefined ? historyOrders[0] : undefined}
                onOrderClick={setOrderFormData}
              />
            </Box>
            <Box mt={'$6'} display='flex' flexDirection={{desktop: 'row', mobile: 'column-reverse'}} flex={1} gap={'$6'}>
              <OrderHistory 
                tokens={tokens}
                loading={historyOrders === undefined}
                orders={historyOrders !== undefined ? historyOrders: []}
              />
              <OrderForms 
                data={orderFormData}
                tokens={tokens}
                onOrderPlaced={onOrderPlaced}
                activeOrders={activeOrders !== undefined ? activeOrders : {buyOrders: [], sellOrders:[]}}
                loading={activeOrders === undefined}
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