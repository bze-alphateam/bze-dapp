import { useToast, useTx } from "@/hooks";
import { amountToUAmount, calculateAmountFromPrice, calculatePricePerUnit, calculateTotalAmount, getChainName, marketIdFromDenoms, prettyAmount, priceToUPrice, uAmountToAmount } from "@/utils";
import { useChain } from "@cosmos-kit/react";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";
import { DefaultBorderedBox } from "../common";
import { Box, Button, Divider, Text, TextField } from "@interchain-ui/react";
import { bze } from '@bze/bzejs';
import { getAddressBalances, removeBalancesCache } from "@/services/data_provider/Balances";
import { AggregatedOrderSDKType } from "@bze/bzejs/types/codegen/beezee/tradebin/order";
import { ActiveOrders, MarketPairTokens } from "./ActiveOrders";
import AddressBalanceListener from "@/services/listener/BalanceListener";
import { useRouter } from "next/router";

export interface OrderFormData {
  price: string;
  amount: string;
  total: string;
}

export const EmptyOrderFormData = {price: "", amount: "", total: ""};

interface OrderFormsProps {
  data: OrderFormData;
  tokens: MarketPairTokens;
  onOrderPlaced?: () => void;
  activeOrders: ActiveOrders;
  loading: boolean;
}

const {createOrder} = bze.tradebin.v1.MessageComposer.withTypeUrl;

function getOrderTxMessages(props: OrderFormsProps, address: string, isBuy: boolean, amount: string, price: string) {
  const marketId = marketIdFromDenoms(props.tokens.baseToken.metadata.base, props.tokens.quoteToken.metadata.base);
  const uAmount = amountToUAmount(amount, props.tokens.baseTokenDisplayDenom.exponent);
  const priceNum = new BigNumber(price);
  const uPrice = priceToUPrice(priceNum, props.tokens.quoteTokenDisplayDenom.exponent, props.tokens.baseTokenDisplayDenom.exponent);
  const orderType = isBuy ? 'buy' : 'sell';

  const uPriceNum = new BigNumber(uPrice);
  const ordersFilter = (order: AggregatedOrderSDKType) => {
    const orderuPriceNum = new BigNumber(order.price);
    if (isBuy) {
      return uPriceNum.gt(orderuPriceNum);
    } else {
      return uPriceNum.lt(orderuPriceNum);
    }
  }
  const ordersToSearch = isBuy ? props.activeOrders.sellOrders.filter(ordersFilter) : props.activeOrders.buyOrders.filter(ordersFilter);

  //if we have no opposite orders we can create 1 message
  if (ordersToSearch.length === 0) {
    return [
      createOrder({
        creator: address,
        marketId: marketId,
        orderType: orderType,
        amount: uAmount,
        price: uPrice,
      })
    ];
  }
  
  const msgs = [];
  let uAmountNum = new BigNumber(uAmount);
  //check active orders prices and fill them one by one if needed
  for (let i = 0; i < ordersToSearch.length; i++) {
    const orderUAmountNum = new BigNumber(ordersToSearch[i].amount);
    let msgAmount = ordersToSearch[i].amount;
    if (orderUAmountNum.gt(uAmountNum)) {
      msgAmount = uAmountNum.toString();
    }
    
    msgs.push(
      createOrder({
        creator: address,
        marketId: marketId,
        orderType: orderType,
        amount: msgAmount,
        price: ordersToSearch[i].price,
      })
    )

    uAmountNum = uAmountNum.minus(msgAmount);
    if (uAmountNum.eq(0)) {
      break;
    }
  }

  if (uAmountNum.gt(0)) {
    msgs.push(
      createOrder({
        creator: address,
        marketId: marketId,
        orderType: orderType,
        amount: uAmountNum.toString(),
        price: uPrice,
      })
    )
  }

  return msgs;
}

export function OrderForms(props: OrderFormsProps) {
  const [isBuy, setIsBuy] = useState(true);
  const [isLoadingValues, setIsLoadingValues] = useState(false);
  const [isPendingSubmit, setIsPendingSubmit] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  //pretty balances
  const [baseBalance, setBasebalance] = useState<string>("0");
  const [quoteBalance, setQuoteBalance] = useState<string>("0");

  const [price, setPrice] = useState<string>(props.data.price);
  const [amount, setAmount] = useState<string>(props.data.amount);
  const [total, setTotal] = useState<string>(props.data.total);

  const { toast } = useToast();
  const { address } = useChain(getChainName());
  const { tx } = useTx();
  const router = useRouter();

  const onPriceChange = (price: string) => {
    setPrice(price);
    if (price === "") {
      return;
    }

    setIsLoadingValues(true);
    if (amount !== "") {
      setTotal(calculateTotalAmount(price, amount, props.tokens.quoteTokenDisplayDenom.exponent));
    } else if (total !== "") {
      setAmount(calculateAmountFromPrice(price, total, props.tokens.baseTokenDisplayDenom.exponent));
    }
    setIsLoadingValues(false);
  }

  const onAmountChange = (amount: string) => {
    setAmount(amount);
    if (amount === "") {
      return;
    }
    setIsLoadingValues(true);
    if (price !== "") {
      setTotal(calculateTotalAmount(price, amount, props.tokens.quoteTokenDisplayDenom.exponent));
    } else if (total !== "") {
      setPrice(calculatePricePerUnit(amount, total, props.tokens.quoteTokenDisplayDenom.exponent));
    }
    setIsLoadingValues(false);
  }

  const onTotalChange = (total: string) => {
    setTotal(total);
    if (total === "") {
      return;
    }
    setIsLoadingValues(true);
    if (price !== "") {
      setAmount(calculateAmountFromPrice(price, total, props.tokens.baseTokenDisplayDenom.exponent));
    } else if (amount !== "") {
      setPrice(calculatePricePerUnit(amount, total, props.tokens.quoteTokenDisplayDenom.exponent));
    }
    setIsLoadingValues(false);
  }

  const onFormSubmit = async () => {
    if (address === undefined) {
      toast({
        type: 'error',
        title: 'Please connect your wallet',
      });

      return;
    }

    const priceNum = new BigNumber(price);
    const amountNum = new BigNumber(amount);
    if (!priceNum.gt(0)) {
      toast({
        type: 'error',
        title: 'Invalid price',
      });

      return;
    }

    if (!amountNum.gt(0)) {
      toast({
        type: 'error',
        title: 'Invalid amount',
      });

      return;
    }

    setIsPendingSubmit(true);
    const msgs = getOrderTxMessages(props, address, isBuy, amount, price);

    await tx(msgs, {
      toast: {
        description: 'Order successful placed'
      },
      onSuccess: () => {
        setAmount("");
        setPrice("");
        setTotal("");
        props.onOrderPlaced ? props.onOrderPlaced() : null;
      }
    });

    setIsPendingSubmit(false);
  }

  const fetchBalances = async () => {
    if (address === undefined) {
      setQuoteBalance("0");
      setBasebalance("0");
      return;
    }

    setIsLoadingBalances(true);
    const allBalances = await getAddressBalances(address);
    const bBal = allBalances.balances.find((bal) => bal.denom === props.tokens.baseToken.metadata.base);
    if (bBal !== undefined) {
      setBasebalance(uAmountToAmount(bBal.amount, props.tokens.baseTokenDisplayDenom.exponent));
    } else {
      setBasebalance("0");
    }

    const qBal = allBalances.balances.find((bal) => bal.denom === props.tokens.quoteToken.metadata.base);
    if (qBal !== undefined) {
      setQuoteBalance(uAmountToAmount(qBal.amount, props.tokens.quoteTokenDisplayDenom.exponent));
    } else {
      setQuoteBalance("0");
    }

    setIsLoadingBalances(false);
  }

  useEffect(() => {
    setPrice(props.data.price);
    setAmount(props.data.amount);
    if (props.data.price !== "" && props.data.amount !== "" && props.tokens.quoteTokenDisplayDenom !== undefined) {
      setTotal(calculateTotalAmount(props.data.price, props.data.amount, props.tokens.quoteTokenDisplayDenom.exponent));
    }
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
  }, [props, address])

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
    <DefaultBorderedBox p={'$2'} width={{desktop: '$auto', mobile: '$auto'}} minHeight={'10vh'} flex={1}>
      <Box display={'flex'} flex={1}>
        <Box display={'flex'} flex={1}><Button intent={isBuy ? "tertiary" : "secondary"} size={isBuy ? "lg": "sm"} fluid onClick={() => {!isBuy ? setIsBuy(true) : null}} disabled={isPendingSubmit}>Buy</Button></Box>
        <Box display={'flex'} flex={1}><Button intent={!isBuy ? "tertiary" : "secondary"} size={!isBuy ? "lg": "sm"} fluid onClick={() => {isBuy ? setIsBuy(false) : null}} disabled={isPendingSubmit}>Sell</Button></Box>
      </Box>
      <Box flex={1} display={'flex'} flexDirection={'row'} justifyContent={'space-between'} p={'$2'} m={'$6'} gap={'$2'}>
        <Box>
          <Text color={'$primary200'} fontWeight={'$semibold'}>Balance:</Text>
        </Box>
        {isLoadingBalances ? 
          <Text>Loading...</Text>
          :
          <Box
          as="a"
          attributes={{
            onClick: () => {isBuy ? onTotalChange(quoteBalance) : onAmountChange(baseBalance)}
          }}
          >
            <Text color={'$primary200'} fontWeight={'$semibold'}>{prettyAmount(isBuy ? quoteBalance : baseBalance)} {isBuy ? props.tokens.quoteTokenDisplayDenom.denom : props.tokens.baseTokenDisplayDenom.denom}</Text>
          </Box>
        }
      </Box>
      <Box display={'flex'} flexDirection={'column'} p={'$2'} m={'$6'} gap={'$2'}>
        <TextField
            id="price"
            type="text"
            size="sm"
            onChange={(e) => {onPriceChange(e.target.value.replace(/[^\d.-]/g, ''))}}
            placeholder=""
            value={price}
            inputMode='numeric'
            intent={'default'}
            disabled={isPendingSubmit}
            startAddon={<Box width={'$16'}  pr={'$2'} display={'flex'} alignItems={'center'}><Text fontSize={'$sm'} fontWeight={'$hairline'}>Price</Text></Box>}
            endAddon={<Box width={'$16'}  pl={'$2'} display={'flex'} alignItems={'center'}><Text fontSize={'$sm'} fontWeight={'$bold'}>{props.tokens.quoteToken.metadata.display}</Text></Box>}
          />
          <TextField
            id="amount"
            type="text"
            size="sm"
            onChange={(e) => {onAmountChange(e.target.value.replace(/[^\d.-]/g, ''))}}
            placeholder=""
            value={amount}
            inputMode='numeric'
            intent={'default'}
            disabled={isPendingSubmit}
            startAddon={<Box width={'$16'} pr={'$2'} display={'flex'} alignItems={'center'}><Text fontSize={'$sm'} fontWeight={'$hairline'}>Amount</Text></Box>}
            endAddon={<Box width={'$16'}  pl={'$2'} display={'flex'} alignItems={'center'}><Text fontSize={'$sm'} fontWeight={'$bold'}>{props.tokens.baseToken.metadata.display}</Text></Box>}
          />
          <Divider my={'$2'} />
          <TextField
            id="total"
            type="text"
            size="sm"
            onChange={(e) => {onTotalChange(e.target.value.replace(/[^\d.-]/g, ''))}}
            placeholder=""
            value={total}
            inputMode='numeric'
            intent={'default'}
            disabled={isPendingSubmit}
            startAddon={<Box width={'$16'} pr={'$2'} display={'flex'} alignItems={'center'}><Text fontSize={'$sm'} fontWeight={'$hairline'}>Total</Text></Box>}
            endAddon={<Box width={'$16'}  pl={'$2'} display={'flex'} alignItems={'center'}><Text fontSize={'$sm'} fontWeight={'$bold'}>{props.tokens.quoteToken.metadata.display}</Text></Box>}
          />
          <Box display={'flex'} m='$6' justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
            <Button size="sm" intent={isBuy ? "success" : "danger"} onClick={() => {onFormSubmit()}} isLoading={isPendingSubmit} disabled={isLoadingValues || props.loading}>{isBuy ? "Buy" : "Sell"} {props.tokens.baseToken.metadata.display}</Button>
          </Box>
      </Box>
    </DefaultBorderedBox>
  );
}
