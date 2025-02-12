import {useToast, useTx} from "@/hooks";
import {
    amountToBigNumberUAmount,
    calculateAmountFromPrice,
    calculatePricePerUnit,
    calculateTotalAmount,
    getChainName,
    getMinAmount,
    getMinPrice,
    marketIdFromDenoms,
    priceToBigNumberUPrice,
    sanitizeNumberInput, toBigNumber,
    uAmountToAmount, uPriceToBigNumberPrice,
} from "@/utils";
import {useChain} from "@cosmos-kit/react";
import BigNumber from "bignumber.js";
import {useEffect, useState} from "react";
import {DefaultBorderedBox} from "../common";
import {Box, Button, Divider, Text, TextField} from "@interchain-ui/react";
import {bze} from '@bze/bzejs';
import {getAddressBalances, removeBalancesCache} from "@/services/data_provider/Balances";
import {AggregatedOrderSDKType} from "@bze/bzejs/types/codegen/beezee/tradebin/order";
import {ActiveOrders, MarketPairTokens} from "./ActiveOrders";
import AddressBalanceListener from "@/services/listener/BalanceListener";
import {useRouter} from "next/router";
import {formatUsdAmount, MarketPrices} from "@/services";
import {FillOrderItem} from "@bze/bzejs/types/codegen/beezee/tradebin/tx";

export interface OrderFormData {
    index: number|undefined;
    orderType: string;
}

export const EmptyOrderFormData = {index: undefined, orderType: "buy"};

interface OrderFormsProps {
    data: OrderFormData;
    tokens: MarketPairTokens;
    onOrderPlaced?: () => void;
    activeOrders: ActiveOrders;
    loading: boolean;
    marketPrices?: MarketPrices;
}

const {createOrder, fillOrders} = bze.tradebin.v1.MessageComposer.withTypeUrl;

function getOrderTxMessages(props: OrderFormsProps, address: string, isBuy: boolean, uAmount: string, uPrice: string) {
    const marketId = marketIdFromDenoms(props.tokens.baseToken.metadata.base, props.tokens.quoteToken.metadata.base);
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
    //props.data contains data about the order that the user clicked on.
    //If the user clicked on a buy order he wants to sell, otherwise he wants to buy
    const [showBuy, setShowBuy] = useState(props.data.orderType === "sell");
    const [isLoadingValues, setIsLoadingValues] = useState(false);
    const [isPendingSubmit, setIsPendingSubmit] = useState(false);
    const [isLoadingBalances, setIsLoadingBalances] = useState(false);

    //used to determine if FillOrders message is required instead of CreateOrder
    const [fillMessage, setFillMessage] = useState("");

    //pretty balances
    const [baseBalance, setBasebalance] = useState<string>("0");
    const [quoteBalance, setQuoteBalance] = useState<string>("0");

    const [price, setPrice] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [total, setTotal] = useState<string>("");

    const [minPrice, setMinPrice] = useState(new BigNumber(0));

    const {toast} = useToast();
    const {address} = useChain(getChainName());
    const {tx} = useTx();
    const router = useRouter();

    const getMatchingOrders = (uPrice: BigNumber, uAmount: BigNumber): AggregatedOrderSDKType[] => {
        if (uPrice.isNaN() || uPrice.lte(0) || uAmount.isNaN() || uAmount.lte(0)) {
            return [];
        }

        let toCheck = [];
        if (showBuy) {
            //reverse them to check from the lowest price to the highest one
            //unpack in a new array to avoid reversing the original one
            toCheck = [...props.activeOrders.sellOrders].reverse();
        } else {
            toCheck = props.activeOrders.buyOrders;
        }

        if (toCheck.length <= 1) {
            return [];
        }

        //check the provided price with the first order price in the order book
        const firstOrderPrice = new BigNumber(toCheck[0].price);
        if ((showBuy && firstOrderPrice.gte(uPrice)) || (!showBuy && firstOrderPrice.lte(uPrice))) {
            return [];
        }

        let finishFunc = (p: BigNumber, c: string) => p.gt(c);
        if (showBuy) {
            finishFunc = (p: BigNumber, c: string) => p.lt(c);
        }

        const result = [];
        for (let i = 0; i < toCheck.length; i++) {
            if (finishFunc(uPrice, toCheck[i].price)) {
                break;
            }
            if (uAmount.lte(0)) {
                break;
            }

            const orderCopy = {...toCheck[i]};
            if (uAmount.minus(toCheck[i].amount).lt(0)) {
                orderCopy.amount = uAmount.toString();
            }

            result.push(orderCopy);
            uAmount = uAmount.minus(orderCopy.amount);
        }

        return result;
    }

    //checks the price and amount to see set the appropriate value of fillOrderRequired
    const checkFillMessage = (uPrice: BigNumber, uAmount: BigNumber) => {
        const toFill = getMatchingOrders(uPrice, uAmount);
        const toFillCount = toFill.length;
        if (toFillCount > 1) {
            setFillMessage(`Match orders with price from ${toFill[0].price} to ${toFill[toFillCount - 1].price}`);
        } else {
            setFillMessage("");
        }
    }

    const onPriceChange = (price: string) => {
        setPrice(price);
        if (price === "") {
            return;
        }

        if (!parseFloat(price)) {
            return;
        }

        setIsLoadingValues(true);
        if (amount !== "" && parseFloat(amount)) {
            setTotal(calculateTotalAmount(price, amount, props.tokens.quoteTokenDisplayDenom.exponent));
        } else if (total !== "" && parseFloat(total)) {
            setAmount(calculateAmountFromPrice(price, total, props.tokens.baseTokenDisplayDenom.exponent));
        }
        setIsLoadingValues(false);
    }

    const onAmountChange = (amount: string) => {
        setAmount(amount);
        if (amount === "") {
            return;
        }

        if (!parseFloat(amount)) {
            return;
        }

        setIsLoadingValues(true);
        if (price !== "" && parseFloat(price)) {
            setTotal(calculateTotalAmount(price, amount, props.tokens.quoteTokenDisplayDenom.exponent));
        } else if (total !== "" && parseFloat(total)) {
            setPrice(calculatePricePerUnit(amount, total, props.tokens.quoteTokenDisplayDenom.exponent));
        }
        setIsLoadingValues(false);
    }

    const onTotalChange = (total: string) => {
        setTotal(total);
        if (total === "") {
            return;
        }

        if (!parseFloat(total)) {
            return;
        }

        setIsLoadingValues(true);
        if (price !== "" && parseFloat(price)) {
            setAmount(calculateAmountFromPrice(price, total, props.tokens.baseTokenDisplayDenom.exponent));
        } else if (amount !== "" && parseFloat(amount)) {
            setPrice(calculatePricePerUnit(amount, total, props.tokens.quoteTokenDisplayDenom.exponent));
        }
        setIsLoadingValues(false);
    }

    const submitFillOrdersMsg = async (toFill: AggregatedOrderSDKType[], walletAddress: string) => {
        setIsPendingSubmit(true);
        const msgOrders: FillOrderItem[] = [];
        for (let i = 0; i < toFill.length; i++) {
            msgOrders.push({
                price: toFill[i].price,
                amount: toFill[i].amount,
            })
        }

        const msg = fillOrders({
            creator: walletAddress,
            marketId: marketIdFromDenoms(props.tokens.baseToken.metadata.base, props.tokens.quoteToken.metadata.base),
            orderType: toFill[0].order_type, //use first order to specify what orders we fill
            orders: msgOrders,
        })

        await tx([msg], {
            toast: {
                description: 'Orders fill submitted successfully.',
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

    const submitCreateOrderMsg = async (uPrice: BigNumber, uAmount: BigNumber, walletAddress: string) => {
        if (showBuy) {
            if (props.activeOrders.sellOrders.length > 0) {
                const maxPrice = props.activeOrders.sellOrders[props.activeOrders.sellOrders.length - 1].price;
                if (uPrice.gt(maxPrice)) {
                    toast({
                        type: 'error',
                        title: `Price is too high. You can buy at a lower price`
                    });

                    return;
                }
            }
        } else {
            if (props.activeOrders.buyOrders.length > 0) {
                const minPrice = props.activeOrders.buyOrders[0].price;
                if (uPrice.lt(minPrice)) {
                    toast({
                        type: 'error',
                        title: `Price is too low. You can sell at a higher price`
                    });

                    return;
                }
            }
        }

        setIsPendingSubmit(true);
        const msgs = getOrderTxMessages(props, walletAddress, showBuy, uAmount.toString(), uPrice.toString());

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

        if (!priceNum.gte(minPrice)) {
            toast({
                type: 'error',
                title: `Price is too low. Min accepted value is: ${minPrice.toFixed(14).toString()}`,
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

        const uAmount = amountToBigNumberUAmount(amount, props.tokens.baseTokenDisplayDenom.exponent);
        const uPrice = priceToBigNumberUPrice(priceNum, props.tokens.quoteTokenDisplayDenom.exponent, props.tokens.baseTokenDisplayDenom.exponent);
        const minAmount = getMinAmount(uPrice.toString(), props.tokens.baseTokenDisplayDenom.exponent);
        if (amountNum.lt(minAmount)) {
            toast({
                type: 'error',
                title: `Amount should be bigger than: ${minAmount.toString()} ${props.tokens.baseTokenDisplayDenom.denom}`,
            });

            return;
        }

        const toFill = getMatchingOrders(uPrice, uAmount);
        if (toFill.length === 0) {
            return submitCreateOrderMsg(uPrice, uAmount, address);
        } else if (toFill.length === 1) {
            return submitCreateOrderMsg(toBigNumber(toFill[0].price), uAmount, address);
        }

        return submitFillOrdersMsg(toFill, address);
    }

    const fetchBalances = async () => {
        if (address === undefined) {
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

    const fillFormFromOrders = (formData: OrderFormData) => {
        if (formData.index === undefined) {
            return;
        }

        const clickedOnSell = props.data.orderType === "sell"
        setShowBuy(clickedOnSell);

        //use the counter orders to fill the form. he clicked on buy, it means he sells, and vice versa
        let orders = props.activeOrders.buyOrders;
        let stopIndex = formData.index;
        if (clickedOnSell) {
            orders = [...props.activeOrders.sellOrders].reverse();
            stopIndex = orders.length - 1 - formData.index;
        }

        if (!orders[stopIndex]) {
            return;
        }

        const price = uPriceToBigNumberPrice(new BigNumber(orders[stopIndex].price), props.tokens.quoteTokenDisplayDenom.exponent, props.tokens.baseTokenDisplayDenom.exponent);
        setPrice(price.toString());
        let uAmount = new BigNumber(0);
        for (let i = 0; i <= stopIndex; i++) {
            uAmount = uAmount.plus(orders[i].amount);
        }

        const amount = uAmountToAmount(uAmount, props.tokens.baseTokenDisplayDenom.exponent);
        setAmount(amount);
        setTotal(price.multipliedBy(amount).decimalPlaces(props.tokens.quoteTokenDisplayDenom.exponent).toString())
    }

    useEffect(() => {
        checkFillMessage(
            priceToBigNumberUPrice(price, props.tokens.quoteTokenDisplayDenom.exponent, props.tokens.baseTokenDisplayDenom.exponent),
            amountToBigNumberUAmount(amount, props.tokens.baseTokenDisplayDenom.exponent)
        );

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [price, amount]);

    useEffect(() => {
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
            setQuoteBalance("0");
            setBasebalance("0");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    useEffect(() => {
        fillFormFromOrders(props.data);
        if (props.tokens.baseTokenDisplayDenom !== undefined && props.tokens.quoteTokenDisplayDenom !== undefined) {
            setMinPrice(getMinPrice(props.tokens.quoteTokenDisplayDenom.exponent, props.tokens.baseTokenDisplayDenom.exponent));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.data, props.tokens])

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
                <Box display={'flex'} flex={1}><Button intent={showBuy ? "tertiary" : "secondary"}
                                                       size={showBuy ? "lg" : "sm"} fluid onClick={() => {
                    !showBuy ? setShowBuy(true) : null
                }} disabled={isPendingSubmit}>Buy</Button></Box>
                <Box display={'flex'} flex={1}><Button intent={!showBuy ? "tertiary" : "secondary"}
                                                       size={!showBuy ? "lg" : "sm"} fluid onClick={() => {
                    showBuy ? setShowBuy(false) : null
                }} disabled={isPendingSubmit}>Sell</Button></Box>
            </Box>
            <Box flex={1} display={'flex'} flexDirection={'row'} justifyContent={'space-between'} p={'$2'} m={'$6'}
                 gap={'$2'}>
                <Box>
                    <Text color={'$primary200'} fontWeight={'$semibold'}>Balance:</Text>
                </Box>
                {isLoadingBalances ?
                    <Text>Loading...</Text>
                    :
                    <Box
                        as="a"
                        attributes={{
                            onClick: () => {
                                showBuy ? onTotalChange(quoteBalance) : onAmountChange(baseBalance)
                            }
                        }}
                    >
                        <Text color={'$primary200'}
                              fontWeight={'$semibold'}>{showBuy ? quoteBalance : baseBalance} {showBuy ? props.tokens.quoteTokenDisplayDenom.denom.toUpperCase() : props.tokens.baseTokenDisplayDenom.denom.toUpperCase()}
                        </Text>
                    </Box>
                }
            </Box>
            <Box display={'flex'} flexDirection={'column'} p={'$2'} m={'$6'} gap={'$2'}>
                <TextField
                    id="price"
                    size="sm"
                    onChange={(e) => {
                        onPriceChange(sanitizeNumberInput(e.target.value))
                    }}
                    placeholder="Price"
                    value={price}
                    type="text"
                    //@ts-ignore
                    inputMode="decimal"
                    intent={'default'}
                    disabled={isPendingSubmit}
                    startAddon={
                        <Box width={'$16'} pr={'$2'} alignItems={'center'} display={{mobile: 'none', desktop: 'flex'}}>
                            <Text fontSize={'$sm'} fontWeight={'$hairline'}>Price</Text>
                        </Box>
                    }
                    endAddon={
                        <Box width={'$16'} pl={'$2'} display={'flex'} alignItems={'center'}>
                            <Text fontSize={'$sm'} fontWeight={'$bold'}>{props.tokens.quoteToken.metadata.display.toUpperCase()}</Text>
                        </Box>}
                />
                {
                    props.marketPrices &&
                    parseFloat(price) > 0 &&
                    props.marketPrices.denom !== props.tokens.baseTokenDisplayDenom.denom &&
                    props.marketPrices.denom !== props.tokens.quoteTokenDisplayDenom.denom &&
                    <Box textAlign={'center'} mb={'$2'}>
                        <Text fontSize={'$xs'} fontWeight={'$thin'}>~{formatUsdAmount(new BigNumber(price).multipliedBy(props.marketPrices.quote))} {props.marketPrices.denom}</Text>
                    </Box>
                }
                <TextField
                    id="amount"
                    type="text"
                    //@ts-ignore
                    inputMode="decimal"
                    size="sm"
                    onChange={(e) => {
                        onAmountChange(sanitizeNumberInput(e.target.value))
                    }}
                    placeholder="Amount"
                    value={amount}
                    intent={'default'}
                    disabled={isPendingSubmit}
                    startAddon={<Box width={'$16'} pr={'$2'} alignItems={'center'} display={{mobile: 'none', desktop: 'flex'}}><Text
                        fontSize={'$sm'} fontWeight={'$hairline'}>Amount</Text></Box>}
                    endAddon={<Box width={'$16'} pl={'$2'} display={'flex'} alignItems={'center'}><Text fontSize={'$sm'}
                                                                                                        fontWeight={'$bold'}>{props.tokens.baseToken.metadata.display.toUpperCase()}</Text></Box>}
                />
                <Divider my={'$2'}/>
                <TextField
                    id="total"
                    type="text"
                    //@ts-ignore
                    inputMode="decimal"
                    size="sm"
                    onChange={(e) => {
                        onTotalChange(sanitizeNumberInput(e.target.value))
                    }}
                    placeholder="Total"
                    value={total}
                    intent={'default'}
                    disabled={isPendingSubmit}
                    startAddon={<Box width={'$16'} pr={'$2'} display={{mobile: 'none', desktop: 'flex'}} alignItems={'center'}><Text
                        fontSize={'$sm'} fontWeight={'$hairline'}>Total</Text></Box>}
                    endAddon={<Box width={'$16'} pl={'$2'} display={'flex'} alignItems={'center'}><Text fontSize={'$sm'}
                                                                                                        fontWeight={'$bold'}>{props.tokens.quoteToken.metadata.display.toUpperCase()}</Text></Box>}
                />
                {
                    props.marketPrices &&
                    parseFloat(total) > 0 &&
                    props.marketPrices.denom !== props.tokens.baseTokenDisplayDenom.denom &&
                    props.marketPrices.denom !== props.tokens.quoteTokenDisplayDenom.denom &&
                    <Box textAlign={'center'} mb={'$2'}><Text fontSize={'$xs'}
                                                              fontWeight={'$thin'}>~{formatUsdAmount(new BigNumber(total).multipliedBy(props.marketPrices.quote))} {props.marketPrices.denom}</Text></Box>
                }
                <Box display={'flex'} m='$6' justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
                    <Button size="sm" intent={showBuy ? "success" : "danger"} onClick={() => {
                        onFormSubmit()
                    }} isLoading={isPendingSubmit}
                            disabled={isLoadingValues || props.loading}>{showBuy ? "Buy" : "Sell"} {props.tokens.baseToken.metadata.display.toUpperCase()}
                    </Button>
                    <Box textAlign={'center'} mt={'$2'}>
                        <Text fontSize={'$xs'} fontWeight={'$thin'}>{fillMessage}</Text>
                    </Box>
                </Box>
            </Box>
        </DefaultBorderedBox>
    );
}
