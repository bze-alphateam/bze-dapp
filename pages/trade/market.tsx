import { Box, Button, Divider, Icon, Skeleton, Text } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { CHART_1D, CHART_1H, CHART_30D, CHART_7D, ChartPoint, Token, getAddressMarketOrders, getAllSupplyTokens, getMarketBuyOrders, getMarketChart, getMarketHistory, getMarketSellOrders, getTokenDisplayDenom } from "@/services";
import BigNumber from "bignumber.js";
import { DenomUnitSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import {getChainName, marketIdFromDenoms, uAmountToAmount, uPriceToPrice } from "@/utils";
import { useChain } from "@cosmos-kit/react";
import { AggregatedOrderSDKType, HistoryOrderSDKType, OrderReferenceSDKType } from "@bze/bzejs/types/codegen/beezee/tradebin/order";
import { ActiveOrdersList, MyOrdersList, OrderHistoryList } from "@/components/trade";
import { OrderForms } from "@/components/trade/OrderForms";
import Chart from "@/components/trade/Chart";

interface MarketChartProps {
  baseToken: Token;
  quoteToken: Token;  
  baseTokenDisplayDenom: DenomUnitSDKType;
  quoteTokenDisplayDenom: DenomUnitSDKType;
}

const DEFAULT_CHART = CHART_7D;

function MarketChart(props: MarketChartProps) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [selectedChart, setSelectedChart] = useState<string>(DEFAULT_CHART);

  const loadChart = async (chartType: string) => {
    setLoading(true);
    const chart = await getMarketChart(
      marketIdFromDenoms(props.baseToken.metadata.base, props.quoteToken.metadata.base),
      chartType,
      props.quoteTokenDisplayDenom.exponent,
      props.baseTokenDisplayDenom.exponent
    );

    setChartData(chart);
    setLoading(false);
  }

  const getChartButtonIntent = (buttonChartType: string) => {
    if (selectedChart === buttonChartType) {
      return "tertiary";
    }

    return "secondary";
  }

  const selectChart = (chartType: string) => {
    setSelectedChart(chartType);
    loadChart(chartType);
  }

  useEffect(() => {
    loadChart(selectedChart);
  }, [props]);

  return (
    <DefaultBorderedBox 
      width={{desktop: '$containerMd', mobile: '$auto'}}
      justifyContent={'center'} 
      alignItems={'center'}
    >
      {!loading ? 
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
              height={500} 
              width={window.innerWidth > 769 ? 700 : 350} 
              margin={{
                top: 20,
                left: 0,
                bottom: 10,
                right: 0,
              }}
              chartData={chartData}
              quoteTokenDisplayDenom={props.quoteTokenDisplayDenom}
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
}

interface ActiveOrdersProps {
  baseToken: Token;
  quoteToken: Token;
  baseTokenDisplayDenom: DenomUnitSDKType;
  quoteTokenDisplayDenom: DenomUnitSDKType;
  buyOrders: AggregatedOrderSDKType[];
  sellOrders: AggregatedOrderSDKType[];
  lastOrder: HistoryOrderSDKType|undefined;
  loading: boolean;
  onOrderClick: (order: AggregatedOrderSDKType) => void
}

function ActiveOrders(props: ActiveOrdersProps) {
  
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
}

interface OrderHistoryProps {
  baseToken: Token;
  quoteToken: Token;  
  baseTokenDisplayDenom: DenomUnitSDKType;
  quoteTokenDisplayDenom: DenomUnitSDKType;
  loading: boolean;
  orders: HistoryOrderSDKType[];
}

function OrderHistory(props: OrderHistoryProps) {  
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
}

interface MyOrdersProps {
  baseToken: Token;
  quoteToken: Token;  
  baseTokenDisplayDenom: DenomUnitSDKType;
  quoteTokenDisplayDenom: DenomUnitSDKType;
  loading: boolean;
  orders: OrderReferenceSDKType[];
  onOrderCancelled: () => void;
}

function MyOrders(props: MyOrdersProps) {  
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
}

export default function MarketPair() {
  const [marketId, setMarketId] = useState("");
  const [loading, setLoading] = useState(true);
  const [baseToken, setBaseToken] = useState<Token>();
  const [baseTokenDisplayDenom, setBaseTokenDisplayDenom] = useState<DenomUnitSDKType>();
  const [quoteToken, setQuoteToken] = useState<Token>()
  const [quoteTokenDisplayDenom, setQuoteTokenDisplayDenom] = useState<DenomUnitSDKType>();

  const [historyOrders, setHistoryOrders] = useState<HistoryOrderSDKType[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [sellOrders, setSellOrders] = useState<AggregatedOrderSDKType[]>([]);
  const [buyOrders, setBuyOrders] = useState<AggregatedOrderSDKType[]>([]);
  const [activeOrdersLoaded, setActiveOrdersLoaded] = useState(false);

  const [myOrders, setMyOrders] = useState<OrderReferenceSDKType[]>([]);
  const [myOrdersLoaded, setMyOrdersLoaded] = useState(false);

  const [orderFormPrice, setOrderFormPrice] = useState("");
  const [orderFormAmount, setOrderFormAmount] = useState("");
  const [orderFormTotal, setOrderFormTotal] = useState("");

  const router = useRouter();
  const { query } = router;
  const { address } = useChain(getChainName());

  const onOrderClick = (order: AggregatedOrderSDKType) => {
    if (quoteTokenDisplayDenom === undefined || baseTokenDisplayDenom === undefined) {
      return;
    }

    const p = uPriceToPrice(new BigNumber(order.price), quoteTokenDisplayDenom.exponent, baseTokenDisplayDenom.exponent);
    setOrderFormPrice(p);
    const a = uAmountToAmount(order.amount, baseTokenDisplayDenom.exponent);
    setOrderFormAmount(a);
    const priceNum = new BigNumber(p);
    const amountNum = new BigNumber(a);
    setOrderFormTotal(priceNum.multipliedBy(amountNum).toString());
  }

  const fetchActiveOrders = async (marketId: string) => {
    const [buy, sell] = await Promise.all([getMarketBuyOrders(marketId), getMarketSellOrders(marketId)]);
    setBuyOrders(buy.list);
    setSellOrders(sell.list);
    setActiveOrdersLoaded(true);
  }

  const fetchMarketHistory = async (marketId: string) => {
    const history = await getMarketHistory(marketId);
    setHistoryOrders(history.list);
    setHistoryLoaded(true);
  }

  const fetchMyOrders = async (marketId: string, address: string|undefined) => {
    setMyOrdersLoaded(false);
    if (address === undefined) {
      setMyOrders([]);
      setMyOrdersLoaded(true);
      return;
    }

    const ord = await getAddressMarketOrders(marketId, address);
    setMyOrders(ord.list);
    setMyOrdersLoaded(true);
  }

  const onOrderPlaced = async () => {
    setActiveOrdersLoaded(false);
    setOrderFormPrice("");
    setOrderFormAmount("");
    setOrderFormTotal("");
    fetchActiveOrders(marketId);
    fetchMarketHistory(marketId);
    fetchMyOrders(marketId, address);
  }

  useEffect(() => {
    const fetchTokens = async (base: string, quote: string) => {
      const allTokens = await getAllSupplyTokens();
      const baseToken = allTokens.get(base);
      const quoteToken = allTokens.get(quote);
      if (baseToken === undefined || quoteToken === undefined) {
        router.push({pathname: '/404'});
        return;
      }

      setBaseToken(baseToken);
      const baseDenomUnit = await getTokenDisplayDenom(baseToken.metadata.base, baseToken);
      if (baseDenomUnit === undefined) {
        return;
      }
      setBaseTokenDisplayDenom(baseDenomUnit);

      const quoteDenomUnit = await getTokenDisplayDenom(quoteToken.metadata.base, quoteToken);
      if (quoteDenomUnit === undefined) {
        return;
      }

      setQuoteTokenDisplayDenom(quoteDenomUnit);
      setQuoteToken(allTokens.get(quote));

      setLoading(false);
    }


    if ((typeof query.base !== 'string') || (typeof query.quote !== 'string')) {
      return;
    }
    const mId = marketIdFromDenoms(query.base, query.quote);
    setMarketId(mId);

    fetchTokens(query.base, query.quote);
    fetchActiveOrders(mId);
    fetchMarketHistory(mId);
    fetchMyOrders(mId, address);
  }, [query, router, address]);

  return (
    <Layout>
      <Box display='block' flexDirection={'row'}>
        <Box marginBottom={'$6'} ml='$6'>
          <Box><Text as="h1" fontSize={'$2xl'}>Market: <Text fontSize={'$2xl'} color={'$primary300'} as="span">{baseToken?.metadata.display}</Text><Text fontSize={'$2xl'} color={'$primary300'} as="span">/{quoteToken?.metadata.display}</Text></Text></Box>
          {historyOrders[0] !== undefined && quoteTokenDisplayDenom !== undefined && baseTokenDisplayDenom !== undefined &&
            <Box display={'flex'} flexDirection={'row'} alignItems={'center'} mt={'$2'} gap={'$2'}>
              <Text>Last price: </Text>
              <Text color={historyOrders[0].order_type === 'sell' ? '$green200' : '$red300'} fontSize={'$md'} fontWeight={'$bold'}>
                {uPriceToPrice(new BigNumber(historyOrders[0].price), quoteTokenDisplayDenom.exponent, baseTokenDisplayDenom.exponent)} {historyOrders[0].order_type === 'sell' ? <Icon name="arrowUpS"/> : <Icon name="arrowDownS"/>}
              </Text>
            </Box>
          }
        </Box>
      </Box >
      <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column'}}  mx='$6'>
        {!loading && baseToken !== undefined && quoteToken !== undefined && baseTokenDisplayDenom !== undefined && quoteTokenDisplayDenom !== undefined &&
          <Box display='flex' flex={1} flexDirection={'column'}>
            <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column'}} flex={1} gap={'$6'}>
              <MarketChart
                baseToken={baseToken}
                quoteToken={quoteToken}
                baseTokenDisplayDenom={baseTokenDisplayDenom}
                quoteTokenDisplayDenom={quoteTokenDisplayDenom}
              />
              <ActiveOrders 
                baseToken={baseToken}
                quoteToken={quoteToken}
                baseTokenDisplayDenom={baseTokenDisplayDenom}
                quoteTokenDisplayDenom={quoteTokenDisplayDenom}
                loading={!activeOrdersLoaded}
                sellOrders={sellOrders}
                buyOrders={buyOrders}
                lastOrder={historyOrders[0] ?? undefined}
                onOrderClick={onOrderClick}
              />
            </Box>
            <Box mt={'$6'} display='flex' flexDirection={{desktop: 'row', mobile: 'column-reverse'}} flex={1} gap={'$6'}>
              <OrderHistory 
                baseToken={baseToken} 
                quoteToken={quoteToken}
                loading={!historyLoaded}
                orders={historyOrders}
                baseTokenDisplayDenom={baseTokenDisplayDenom}
                quoteTokenDisplayDenom={quoteTokenDisplayDenom}
              />
              <OrderForms 
                price={orderFormPrice}
                amount={orderFormAmount}
                total={orderFormTotal}
                baseTokenDisplayDenom={baseTokenDisplayDenom}
                quoteTokenDisplayDenom={quoteTokenDisplayDenom}
                baseToken={baseToken}
                quoteToken={quoteToken}
                onOrderPlaced={onOrderPlaced}
                sellOrders={sellOrders}
                buyOrders={buyOrders}
                loading={!activeOrdersLoaded}
              />
            </Box>
            <Box mt={'$6'} display='flex' flex={1} gap={'$6'}>
              <MyOrders 
                baseToken={baseToken} 
                quoteToken={quoteToken}
                loading={!myOrdersLoaded}
                orders={myOrders}
                baseTokenDisplayDenom={baseTokenDisplayDenom}
                quoteTokenDisplayDenom={quoteTokenDisplayDenom}
                onOrderCancelled={onOrderPlaced}
              />
            </Box>
          </Box>
        }
      </Box>
    </Layout>
  );
}