import { Token } from "@/services";
import { uAmountToAmount, uPriceToPrice } from "@/utils";
import { AggregatedOrderSDKType, HistoryOrderSDKType } from "@bze/bzejs/types/codegen/beezee/tradebin/order";
import { DenomUnitSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import { Box, Divider, Icon, Stack, Text } from "@interchain-ui/react";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";

export function PriceHeaderLine({ticker}: {ticker: string}) {
  return (
    <Box width={'33%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
      <Text color={'$primary200'}>Price({ticker})</Text>
    </Box>
  );
}

export function AmountHeaderLine({ticker}: {ticker: string}) {
  return (
    <Box width={'33%'} display={'flex'} flex={1} justifyContent={'center'}>
      <Text color={'$primary200'}>Amount({ticker})</Text>
    </Box>
  );
}

export function TotalHeaderLine({ticker}: {ticker: string}) {
  return (
    <Box width={'34%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
      <Text color={'$primary200'}>Total({ticker})</Text>
    </Box>
  );
}

export function PriceLine({price, orderType}: {price: string, orderType: string}) {
  return (
    <Box width={'33%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
      <Text fontSize={'$sm'} color={orderType === 'buy' ? '$green200': '$red300'}>{price}</Text>
    </Box>
  );
}

export function AmountLine({amount, orderType}: {amount: string, orderType: string}) {
  return (
    <Box width={'33%'} display={'flex'} flex={1} justifyContent={'center'}>
      <Text fontSize={'$sm'} color={orderType === 'buy' ? '$green200': '$red300'}>{amount}</Text>
    </Box>
  );
}

export function TotalLine({total, orderType}: {total: string, orderType: string}) {
  return (
    <Box width={'34%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
      <Text fontSize={'$sm'} color={orderType === 'buy' ? '$green200': '$red300'}>{total}</Text>
    </Box>
  );
}

export interface ActiveOrderStackProps {
  orderType: string;
  order: AggregatedOrderSDKType;
  baseTokenDisplayDenom: DenomUnitSDKType;
  quoteTokenDisplayDenom: DenomUnitSDKType;
  onClick: (order: AggregatedOrderSDKType) => void;
}

export function ActiveOrderStack(props: ActiveOrderStackProps) {
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [total, setTotal] = useState("");

  useEffect(() =>{
    const p = uPriceToPrice(new BigNumber(props.order.price), props.quoteTokenDisplayDenom.exponent, props.baseTokenDisplayDenom.exponent);
    setPrice(p);
    const a = uAmountToAmount(props.order.amount, props.baseTokenDisplayDenom.exponent);
    setAmount(a);
    const priceNum = new BigNumber(p);
    const amountNum = new BigNumber(a);
    setTotal(priceNum.multipliedBy(amountNum).decimalPlaces(props.quoteTokenDisplayDenom.exponent).toString());
  }, [props])

  return (
    <Box
    as="a"
    attributes={{
      onClick: () => {props.onClick(props.order)}
    }}
    >
      <Stack space={'$2'} attributes={{ marginBottom: "$0" }} >
        <PriceLine price={price} orderType={props.orderType}/>
        <AmountLine amount={amount} orderType={props.orderType}/>
        <TotalLine total={total} orderType={props.orderType}/>
      </Stack> 
    </Box>
  )
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

export function ActiveOrdersList(props: ActiveOrdersProps) {
  return (
    <Box display={'flex'} flex={1} flexDirection={'column'}>
      <Stack space={'$6'} attributes={{ marginBottom: "$4", flex: 1 }} justify={'center'}>
        <PriceHeaderLine ticker={props.quoteToken.metadata.display}/>
        <AmountHeaderLine ticker={props.baseToken.metadata.display}/>
        <TotalHeaderLine ticker={props.quoteToken.metadata.display}/>
      </Stack>
      <Box display={'flex'} flex={1} flexDirection={'column'} justifyContent={'center'}>
        {!props.loading ?
        <>
          <Box 
            minHeight={'150px'} 
            alignItems={'flex-end'}
            display={'flex'}
            flex={1}
          >
            <Box display={'flex'} flex={1} flexDirection={'column'}>
              {props.sellOrders.length > 0 ?
                props.sellOrders.map((order: AggregatedOrderSDKType, index: number) => (
                  <ActiveOrderStack 
                    baseTokenDisplayDenom={props.baseTokenDisplayDenom}
                    quoteTokenDisplayDenom={props.quoteTokenDisplayDenom}
                    order={order}
                    orderType="sell"
                    onClick={props.onOrderClick}
                    key={index}
                  />
                ))
                :
                <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>No sell orders...</Text></Box>
              }
            </Box> 
          </Box>
          <Divider my={'$2'}/>
          <Box flex={1} display={'flex'} justifyContent={'center'}>
            {props.lastOrder && <Text color={props.lastOrder.order_type === 'sell' ? '$green200' : '$red300'} fontSize={'$md'}>{uPriceToPrice(new BigNumber(props.lastOrder.price), props.quoteTokenDisplayDenom.exponent, props.baseTokenDisplayDenom.exponent)} {props.lastOrder.order_type === 'sell' ? <Icon name="arrowUpS"/> : <Icon name="arrowDownS"/>}</Text>}
          </Box>
          <Divider my={'$2'}/>
          <Box minHeight={'150px'}>
            {props.buyOrders.length > 0 ?
                props.buyOrders.map((order: AggregatedOrderSDKType, index: number) => (
                <ActiveOrderStack 
                  key={index}
                  baseTokenDisplayDenom={props.baseTokenDisplayDenom}
                  quoteTokenDisplayDenom={props.quoteTokenDisplayDenom}
                  order={order}
                  orderType="buy"
                  onClick={props.onOrderClick}
                />
              ))
              :
              <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>No buy orders...</Text></Box>
            }
          </Box>
        </>  
        :
          <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>Loading...</Text></Box>
        }
      </Box>
    </Box>
  )
}