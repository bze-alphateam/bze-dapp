import {Token} from "@/services";
import {uAmountToAmount, uPriceToPrice} from "@/utils";
import {AggregatedOrderSDKType, HistoryOrderSDKType} from "@bze/bzejs/types/codegen/beezee/tradebin/order";
import {DenomUnitSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import {Box, Divider, Icon, Stack, Text} from "@interchain-ui/react";
import BigNumber from "bignumber.js";
import {useCallback, useEffect, useState} from "react";
import {OrderFormData} from "./OrderForms";

export interface MarketPairTokens {
    baseToken: Token;
    baseTokenDisplayDenom: DenomUnitSDKType;
    quoteToken: Token;
    quoteTokenDisplayDenom: DenomUnitSDKType;
}

export function PriceHeaderLine({ticker}: { ticker: string }) {
    return (
        <Box width={'33%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
            <Text color={'$primary200'}>Price({ticker.toUpperCase()})</Text>
        </Box>
    );
}

export function AmountHeaderLine({ticker}: { ticker: string }) {
    return (
        <Box width={'33%'} display={'flex'} flex={1} justifyContent={'center'}>
            <Text color={'$primary200'}>Amount({ticker.toUpperCase()})</Text>
        </Box>
    );
}

export function TotalHeaderLine({ticker}: { ticker: string }) {
    return (
        <Box width={'34%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
            <Text color={'$primary200'}>Total({ticker.toUpperCase()})</Text>
        </Box>
    );
}

export function PriceLine({price, orderType}: { price: string, orderType: string }) {
    return (
        <Box width={'33%'} display={'flex'} flex={1} justifyContent={'flex-start'}>
            <Text fontSize={'$sm'} color={orderType === 'buy' ? '$green200' : '$red300'}>{price}</Text>
        </Box>
    );
}

export function AmountLine({amount, orderType}: { amount: string, orderType: string }) {
    return (
        <Box width={'33%'} display={'flex'} flex={1} justifyContent={'center'}>
            <Text fontSize={'$sm'} color={orderType === 'buy' ? '$green200' : '$red300'}>{amount}</Text>
        </Box>
    );
}

export function TotalLine({total, orderType}: { total: string, orderType: string }) {
    return (
        <Box width={'34%'} display={'flex'} flex={1} justifyContent={'flex-end'}>
            <Text fontSize={'$sm'} color={orderType === 'buy' ? '$green200' : '$red300'}>{total}</Text>
        </Box>
    );
}

export interface ActiveOrderStackProps {
    orderType: string;
    order: AggregatedOrderSDKType;
    baseTokenDisplayDenom: DenomUnitSDKType;
    quoteTokenDisplayDenom: DenomUnitSDKType;
    onClick: () => void
}

export function ActiveOrderStack(props: ActiveOrderStackProps) {
    const [data, setData] = useState({price: "", amount: "", total: ""});

    useEffect(() => {
        const p = uPriceToPrice(new BigNumber(props.order.price), props.quoteTokenDisplayDenom.exponent, props.baseTokenDisplayDenom.exponent);
        const a = uAmountToAmount(props.order.amount, props.baseTokenDisplayDenom.exponent);
        const priceNum = new BigNumber(p);
        const amountNum = new BigNumber(a);
        setData({
            price: p,
            amount: a,
            total: priceNum.multipliedBy(amountNum).decimalPlaces(props.quoteTokenDisplayDenom.exponent).toString(),
        });
    }, [props])

    return (
        <Box
            as="a"
            attributes={{
                onClick: props.onClick
            }}
        >
            <Stack space={'$2'} attributes={{marginBottom: "$0"}}>
                <PriceLine price={data.price} orderType={props.orderType}/>
                <AmountLine amount={data.amount} orderType={props.orderType}/>
                <TotalLine total={data.total} orderType={props.orderType}/>
            </Stack>
        </Box>
    )
}

export interface ActiveOrders {
    buyOrders: AggregatedOrderSDKType[];
    sellOrders: AggregatedOrderSDKType[];
}

export interface ActiveOrdersProps {
    tokens: MarketPairTokens
    orders: ActiveOrders;
    lastOrder: HistoryOrderSDKType | undefined;
    loading: boolean;
    onOrderClick: (index: number, orderType: string) => void
}

export function ActiveOrdersList(props: ActiveOrdersProps) {

    const buyOrderClickCallback = useCallback((index: number) => {
        props.onOrderClick(index, "buy");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const sellOrderClickCallback = useCallback((index: number) => {
        props.onOrderClick(index, "sell");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    return (
        <Box display={'flex'} flex={1} flexDirection={'column'}>
            <Stack space={'$6'} attributes={{marginBottom: "$4", flex: 1}} justify={'center'}>
                <PriceHeaderLine ticker={props.tokens.quoteToken.metadata.display}/>
                <AmountHeaderLine ticker={props.tokens.baseToken.metadata.display}/>
                <TotalHeaderLine ticker={props.tokens.quoteToken.metadata.display}/>
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
                                {props.orders.sellOrders.length > 0 ?
                                    props.orders.sellOrders.map((order: AggregatedOrderSDKType, index: number) => (
                                        <ActiveOrderStack
                                            baseTokenDisplayDenom={props.tokens.baseTokenDisplayDenom}
                                            quoteTokenDisplayDenom={props.tokens.quoteTokenDisplayDenom}
                                            order={order}
                                            orderType="sell"
                                            onClick={() => sellOrderClickCallback(index)}
                                            key={`${order.price}${order.amount}`}
                                        />
                                    ))
                                    :
                                    <Box display={'flex'} flex={1} justifyContent={'center'}
                                         alignItems={'center'}><Text>No sell orders...</Text></Box>
                                }
                            </Box>
                        </Box>
                        <Divider my={'$2'}/>
                        <Box flex={1} display={'flex'} justifyContent={'center'}>
                            {props.lastOrder &&
                                <Text color={props.lastOrder.order_type === 'sell' ? '$green200' : '$red300'}
                                      fontSize={'$md'}>{uPriceToPrice(new BigNumber(props.lastOrder.price), props.tokens.quoteTokenDisplayDenom.exponent, props.tokens.baseTokenDisplayDenom.exponent)} {props.lastOrder.order_type === 'sell' ?
                                    <Icon name="arrowUpS"/> : <Icon name="arrowDownS"/>}</Text>}
                        </Box>
                        <Divider my={'$2'}/>
                        <Box minHeight={'150px'}>
                            {props.orders.buyOrders.length > 0 ?
                                props.orders.buyOrders.map((order: AggregatedOrderSDKType, index: number) => (
                                    <ActiveOrderStack
                                        baseTokenDisplayDenom={props.tokens.baseTokenDisplayDenom}
                                        quoteTokenDisplayDenom={props.tokens.quoteTokenDisplayDenom}
                                        order={order}
                                        orderType="buy"
                                        onClick={() => buyOrderClickCallback(index)}
                                        key={`${order.price}${order.amount}`}
                                    />
                                ))
                                :
                                <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>No
                                    buy orders...</Text></Box>
                            }
                        </Box>
                    </>
                    :
                    <Box display={'flex'} flex={1} justifyContent={'center'}
                         alignItems={'center'}><Text>Loading...</Text></Box>
                }
            </Box>
        </Box>
    )
}