import { Token } from "@/services";
import { uAmountToAmount, uPriceToPrice } from "@/utils";
import { HistoryOrderSDKType } from "@bze/bzejs/types/codegen/beezee/tradebin/order";
import { Box, Stack, Text } from "@interchain-ui/react";
import BigNumber from "bignumber.js";
import { DenomUnitSDKType } from "interchain-query/cosmos/bank/v1beta1/bank";
import { useEffect, useState } from "react";

interface OrderHistoryProps {
  baseToken: Token;
  quoteToken: Token;  
  loading: boolean;
  orders: HistoryOrderSDKType[];
  baseTokenDisplayDenom: DenomUnitSDKType;
  quoteTokenDisplayDenom: DenomUnitSDKType;
}

interface OrderHistoryListRowProps {
  order: HistoryOrderSDKType;
  baseTokenDisplayDenom: DenomUnitSDKType;
  quoteTokenDisplayDenom: DenomUnitSDKType;
}

function OrderHistoryListRow(props: OrderHistoryListRowProps) {
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState("");

  useEffect(() =>{
    const p = uPriceToPrice(new BigNumber(props.order.price), props.quoteTokenDisplayDenom.exponent, props.baseTokenDisplayDenom.exponent);
    setPrice(p);
    const a = uAmountToAmount(props.order.amount, props.baseTokenDisplayDenom.exponent);
    setAmount(a);
    const execAt = new Date(parseInt(props.order.executed_at.toString()) * 1000);
    const intl = new Intl.DateTimeFormat("en-US", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,    
    });

    setTime(intl.format(execAt));
  }, [props])

  return (
    <Stack space={'$2'} attributes={{ marginBottom: "$0", flex: 1 }} justify={'center'}>
      <Box width={'33%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
        <Text fontSize={'$sm'} color={'$red300'}>{price}</Text>
      </Box>
      <Box width={'33%'} display={'flex'} flex={1} justifyContent={'center'}>
        <Text fontSize={'$sm'} color={'$red300'}>{amount}</Text>
      </Box>
      <Box width={'34%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
        <Text fontSize={'$sm'} color={'$red300'}>{time}</Text>
      </Box>
    </Stack>
  );
}

export function OrderHistoryList(props: OrderHistoryProps) {

  return (
    <Box display={'flex'} flex={1} flexDirection={'column'}>
      <Stack space={'$6'} attributes={{ marginBottom: "$4", flex: 1 }} justify={'center'}>
        <Box width={'33%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
          <Text color={'$primary200'}>Price({props.quoteToken.metadata.display})</Text>
        </Box>
        <Box width={'33%'} display={'flex'} flex={1} justifyContent={'center'}>
          <Text color={'$primary200'}>Amount({props.baseToken.metadata.display})</Text>
        </Box>
        <Box width={'34%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
          <Text color={'$primary200'}>Time</Text>
        </Box>
      </Stack>
      {!props.loading ? 
        (props.orders.length > 0 ?
          props.orders.map((order, index) => (
            <OrderHistoryListRow 
              baseTokenDisplayDenom={props.baseTokenDisplayDenom}
              quoteTokenDisplayDenom={props.quoteTokenDisplayDenom}
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
