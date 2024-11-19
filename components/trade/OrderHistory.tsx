import { useToast, useTx } from "@/hooks";
import {Token, getMarketOrder, HistoryOrder} from "@/services";
import { getChainName, uAmountToAmount, uPriceToPrice } from "@/utils";
import { HistoryOrderSDKType, OrderReferenceSDKType, OrderSDKType } from "@bze/bzejs/types/codegen/beezee/tradebin/order";
import { useChain } from "@cosmos-kit/react";
import { Box, Button, Skeleton, Stack, Text, useColorModeValue } from "@interchain-ui/react";
import BigNumber from "bignumber.js";
import { DenomUnitSDKType } from "interchain-query/cosmos/bank/v1beta1/bank";
import { memo, useEffect, useState } from "react";
import { bze } from '@bze/bzejs';
import { MarketPairTokens } from "./ActiveOrders";
import WalletConnectCallout from "@/components/wallet/WalletCallout";

interface HistoryBoxItemProps {
  orderType: string;
  price: string|number;
  amount: string|number;
  time: Date;
}

function HistoryBoxItem(props: HistoryBoxItemProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const intl = new Intl.DateTimeFormat("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });

    setTime(intl.format(props.time));
  }, [props])

  return (
      <Stack space={'$2'} attributes={{ marginBottom: "$0", flex: 1 }} justify={'center'}>
        <Box width={'5%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
          <Text fontSize={'$sm'} color={props.orderType === 'buy' ? '$green200': '$red300'}>{props.orderType}</Text>
        </Box>
        <Box width={'40%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
          <Text fontSize={'$sm'} color={props.orderType === 'buy' ? '$green200': '$red300'}>{props.price}</Text>
        </Box>
        <Box width={'30%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
          <Text fontSize={'$sm'} color={props.orderType === 'buy' ? '$green200': '$red300'}>{props.amount}</Text>
        </Box>
        <Box width={'25%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
          <Text fontSize={'$sm'} color={props.orderType === 'buy' ? '$green200': '$red300'}>{time}</Text>
        </Box>
      </Stack>
  )
}

interface HistoryBoxHeaderProps {
  tokens: MarketPairTokens;
}

function HistoryBoxHeader(props: HistoryBoxHeaderProps) {
  return (
      <Stack space={'$6'} attributes={{ marginBottom: "$4", flex: 1 }} justify={'center'}>
        <Box width={'5%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
          <Text color={'$primary200'}>Order</Text>
        </Box>
        <Box width={'40%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
          <Text color={'$primary200'}>Price({props.tokens.quoteToken.metadata.display.toUpperCase()})</Text>
        </Box>
        <Box width={'30%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
          <Text color={'$primary200'}>Amount({props.tokens.baseToken.metadata.display.toUpperCase()})</Text>
        </Box>
        <Box width={'25%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
          <Text color={'$primary200'}>Time</Text>
        </Box>
      </Stack>
  )
}

interface MyHistoryListRowProps {
  order: HistoryOrder;
}

function MyHistoryListRow(props: MyHistoryListRowProps) {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const execAt = new Date(parseInt(props.order.executed_at));

    setTime(execAt);
  }, [props])

  return (
      <HistoryBoxItem orderType={props.order.order_type} price={props.order.price} amount={props.order.base_volume} time={time}/>
  );
}

export function MyHistoryList(props: OrderHistoryProps) {
  const { address } = useChain(getChainName());

  return (
      <Box display={'flex'} flex={1} flexDirection={'column'} maxHeight={'300px'} overflowY={'scroll'}>
        <HistoryBoxHeader tokens={props.tokens} />
        {!props.loading ?
            (!address ?
                <Box flex={1} justifyContent={'center'} display={'flex'}><WalletConnectCallout props={{text: "Connect your wallet to see your trading history"}} /></Box>:
                (props.orders.length > 0 ?
                    props.userOrders.map((order, index) => (
                        <MyHistoryListRow
                            order={order}
                            key={index}
                        />
                    ))
                    :
                    <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>No history orders...</Text></Box>
                )
            )
            :
            <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>Loading...</Text></Box>
        }
      </Box>
  );
}

interface OrderHistoryProps {
  tokens: MarketPairTokens; 
  loading: boolean;
  orders: HistoryOrderSDKType[];
  userOrders: HistoryOrder[];
}

interface OrderHistoryListRowProps {
  order: HistoryOrderSDKType;
  baseTokenDisplayDenom: DenomUnitSDKType;
  quoteTokenDisplayDenom: DenomUnitSDKType;
}

function OrderHistoryListRow(props: OrderHistoryListRowProps) {
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const p = uPriceToPrice(new BigNumber(props.order.price), props.quoteTokenDisplayDenom.exponent, props.baseTokenDisplayDenom.exponent);
    setPrice(p);
    const a = uAmountToAmount(props.order.amount, props.baseTokenDisplayDenom.exponent);
    setAmount(a);
    const execAt = new Date(parseInt(props.order.executed_at.toString()) * 1000);

    setTime(execAt);
  }, [props])

  return (
      <HistoryBoxItem orderType={props.order.order_type} price={price} amount={amount} time={time}/>
  );
}

export function OrderHistoryList(props: OrderHistoryProps) {
  return (
    <Box display={'flex'} flex={1} flexDirection={'column'} maxHeight={'300px'} overflowY={'scroll'}>
      <HistoryBoxHeader tokens={props.tokens} />
      {!props.loading ? 
        (props.orders.length > 0 ?
          props.orders.map((order, index) => (
            <OrderHistoryListRow 
              baseTokenDisplayDenom={props.tokens.baseTokenDisplayDenom}
              quoteTokenDisplayDenom={props.tokens.quoteTokenDisplayDenom}
              order={order}
              key={index}
            />
          ))
        :
        <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>No history orders...</Text></Box>
        )
      : 
        <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>Loading...</Text></Box>
      }
    </Box>
  );
}

interface MyOrdersListRowProps {
  order: OrderReferenceSDKType;
  baseTokenDisplayDenom: DenomUnitSDKType;
  quoteTokenDisplayDenom: DenomUnitSDKType;
  onOrderCancel: () => void;
}

const {cancelOrder} = bze.tradebin.v1.MessageComposer.withTypeUrl;

const MyOrdersListRow = memo((props: MyOrdersListRowProps) => {
  const [loading, setLoading] = useState(true);
  const [fullOrder, setFullOrder] = useState<OrderSDKType|undefined>();
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [background, setBackground] = useState<string|undefined>();

  const { toast } = useToast();
  const { address } = useChain(getChainName());
  const { tx } = useTx();
  const backgroundColor = useColorModeValue('#ddd7d782', '#2b3039b0')

  const onOrderCancel = async () => {
    if (address === undefined || fullOrder === undefined) {
      toast({
        type: 'error',
        title: 'Please connect your wallet',
      });

      return;
    }

    setLoading(true);
    const msg = cancelOrder({
      creator: address,
      marketId: fullOrder.market_id,
      orderId: fullOrder.id,
      orderType: fullOrder.order_type,
    });

    await tx([msg], {
      toast: {
        description: 'Order cancelled'
      },
      onSuccess: () => {
        props.onOrderCancel ? props.onOrderCancel() : null;
      }
    });

    setLoading(false);
  }

  useEffect(() => {
    const fetchFullOrder = async () => {
      setLoading(true);
      const ord = await getMarketOrder(props.order.market_id, props.order.order_type, props.order.id);
      if (ord.order === undefined) {
        return;
      }
  
      const p = uPriceToPrice(new BigNumber(ord.order.price), props.quoteTokenDisplayDenom.exponent, props.baseTokenDisplayDenom.exponent);
      setPrice(p);
      const a = uAmountToAmount(ord.order.amount, props.baseTokenDisplayDenom.exponent);
      setAmount(a);
      setFullOrder(ord.order);
      setLoading(false);
    }

    fetchFullOrder();
  }, [props])

  return (
    <Stack
      space={'$2'}
      attributes={{ marginBottom: "$2", flex: 1 }}
      justify={'center'}
      >
      {loading ?
        <Skeleton 
          display={'flex'}
          flex={1}
          borderRadius="$sm"
          height="$6"
          width="$6"
        />
      :
        <Box
          display={'flex'}
          flexDirection={'row'}
          flex={1}
          backgroundColor={background}
          alignItems={'center'}
          attributes={{
            onMouseOver: () => setBackground(backgroundColor),
            onMouseLeave: () => setBackground(undefined)
          }}
        >
          <Box width={'25%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
            <Text fontSize={'$sm'} color={props.order.order_type === 'buy' ? '$green200': '$red300'}>{price}</Text>
          </Box>
          <Box width={'25%'} display={'flex'} flex={1} justifyContent={'center'}>
            <Text fontSize={'$sm'} color={props.order.order_type === 'buy' ? '$green200': '$red300'}>{amount}</Text>
          </Box>
          <Box width={'25%'} display={'flex'} flex={1} justifyContent={'center'}>
            <Text fontSize={'$sm'} color={props.order.order_type === 'buy' ? '$green200': '$red300'}>{fullOrder?.order_type}</Text>
          </Box>  
          <Box width={'25%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
            <Button size="xs" intent="secondary" isLoading={loading} onClick={onOrderCancel}>Cancel</Button>
          </Box>  
        </Box>
      }
    </Stack>
  );
});
MyOrdersListRow.displayName = 'MyOrdersListRow';

interface MyOrdersProps {
  tokens: MarketPairTokens;
  loading: boolean;
  orders: OrderReferenceSDKType[];
  onOrderCancelled: () => void;
}

export function MyOrdersList(props: MyOrdersProps) {

  return (
    <Box display={'flex'} flex={1} flexDirection={'column'} maxHeight={'250px'} overflowY={'scroll'}>
      <Stack space={'$6'} attributes={{ marginBottom: "$4", flex: 1 }} justify={'center'}>
        <Box width={'25%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
          <Text color={'$primary200'}>Price({props.tokens.quoteToken.metadata.display.toUpperCase()})</Text>
        </Box>
        <Box width={'25%'} display={'flex'} flex={1} justifyContent={'center'}>
          <Text color={'$primary200'}>Amount({props.tokens.baseToken.metadata.display.toUpperCase()})</Text>
        </Box>
        <Box width={'25%'} display={'flex'} flex={1} justifyContent={'center'}>
          <Text color={'$primary200'}>Type</Text>
        </Box>
        <Box width={'25%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
          <Text color={'$primary200'}>Action</Text>
        </Box>
      </Stack>
      {!props.loading ? 
        (props.orders.length > 0 ?
          props.orders.map((order, index) => (
            <MyOrdersListRow 
              baseTokenDisplayDenom={props.tokens.baseTokenDisplayDenom}
              quoteTokenDisplayDenom={props.tokens.quoteTokenDisplayDenom}
              order={order}
              key={order.id}
              onOrderCancel={props.onOrderCancelled}
            />
          ))
        :
        <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>No orders found...</Text></Box>
        )
      : 
        <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>Loading...</Text></Box>
      }
    </Box>
  );
}
