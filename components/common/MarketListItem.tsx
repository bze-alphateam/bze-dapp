import {formatUsdAmount, getMarketUsdPrices, MarketPrices, Ticker, Token} from "@/services";
import {BaseComponentProps, Box, Button, Icon, Stack, Text} from "@interchain-ui/react";
import {useEffect, useMemo, useState} from "react";
import {marketIdFromDenoms, prettyAmount} from "@/utils";
import BigNumber from "bignumber.js";

export interface MarketListItemProps extends BaseComponentProps {
    withdrawLabel?: string;
    showWithdraw?: boolean;
    onWithdraw?: (event?: any) => void;
    baseToken?: Token;
    quoteToken?: Token;
    tickers?: Map<string, Ticker>;
}

function PriceChangeIcon(props: { priceChange: number }) {
    if (props.priceChange === 0.0) {
        return null;
    }

    return (
        <Icon name={props.priceChange > 0.0 ? "arrowUpS" : "arrowDownS"}/>
    );
}

// needChainSpace={true}
// isOtherChains={false}
export default function MarketListItem(props: MarketListItemProps) {
    const [priceChange, setPriceChange] = useState(0.00);
    const [lastPrice, setLastPrice] = useState(0);
    const [volume, setVolume] = useState(0);
    const [marketPrices, setMarketPrices] = useState<MarketPrices | undefined>();

    const getPriceChangeColor = useMemo((): string => {
        if (priceChange === 0.0) {
            return "$textSecondary";
        }

        return priceChange > 0.0 ? "$green200" : "$red200";
    }, [priceChange]);

    useEffect(() => {
        if (!props.tickers) {
            return;
        }

        if (!props.baseToken?.metadata?.base || !props.quoteToken?.metadata?.base) {
            return;
        }

        const foundTicker = props.tickers.get(marketIdFromDenoms(props.baseToken.metadata.base, props.quoteToken.metadata.base));
        if (foundTicker) {
            setPriceChange(foundTicker.change);
            setLastPrice(foundTicker.last_price);
            setVolume(foundTicker.quote_volume);

            getMarketUsdPrices(props.baseToken, props.quoteToken, new BigNumber(foundTicker.last_price))
                .then((prices) => {
                    setMarketPrices(prices)
                })
                .catch((e) => console.error(e));
        }

    }, [props]);

    return (
        <Stack
            attributes={{
                minWidth: "720px",
                alignItems: "center",
            }}
            className={props.className}
        >
            {
                props.baseToken && props.quoteToken ?
                    <>
                        <Box width="$22">
                            <Box as="img" attributes={{src: props.baseToken.logo}} width={"$14"} height={"$14"}/>
                            <Box as="img" attributes={{src: props.quoteToken.logo}} width={"$14"} height={"$14"}/>
                        </Box>
                        <Stack attributes={{alignItems: "center", flex: 1}}>
                            <Stack space="$0" direction="vertical" attributes={{width: "20%"}}>
                                <Text fontSize={'$sm'} fontWeight="$semibold" attributes={{marginBottom: "$2"}}>
                                    {props.baseToken.metadata.symbol}/{props.quoteToken.metadata.symbol}
                                </Text>
                                <Text fontSize={'$sm'} color="$textSecondary">
                                    {props.baseToken.verified && props.quoteToken.verified ? '✅ Verified' : '❌ Not verified'}
                                </Text>
                            </Stack>
                            <Stack attributes={{width: "10%"}}>
                            </Stack>
                            <Stack space="$0" direction="vertical" attributes={{width: "35%",}} flex={1}>
                                <Box flex={1} display={"flex"} flexDirection={"row"}>
                                    <Box mb={"$2"}><Text fontSize={'$sm'} fontWeight={"$semibold"}
                                                         color={getPriceChangeColor}>{lastPrice} {props.quoteToken?.metadata.display?.toUpperCase()}</Text></Box>
                                    <Box><Text fontSize={'$xs'} fontWeight={"$semibold"}
                                               color={getPriceChangeColor}>({priceChange > 0.0 ? "+" : ""}{priceChange}%)<PriceChangeIcon
                                        priceChange={priceChange}/></Text></Box>
                                </Box>
                                {
                                    marketPrices && props.quoteToken && marketPrices.denom.toUpperCase() !== props.quoteToken.metadata.display?.toUpperCase() &&
                                    <Box flex={1} display={"flex"} flexDirection={"row"}>
                                        <Box><Text fontSize={'$xs'} fontWeight={"$hairline"}
                                                   color={"$textSecondary"}>~ {formatUsdAmount(marketPrices.quote.multipliedBy(lastPrice))} {marketPrices.denom.toUpperCase()}</Text></Box>
                                    </Box>
                                }
                            </Stack>
                            <Stack space="$0" direction="vertical" attributes={{width: "35%"}} flex={1}>
                                <Box mb={"$2"} flex={1} display={"flex"} flexDirection={"row"}
                                     justifyContent={"flex-end"}>
                                    <Box><Text fontSize={'$sm'}
                                               fontWeight={"$semibold"}>{prettyAmount(volume)} {props.quoteToken?.metadata.display?.toUpperCase()}</Text></Box>
                                </Box>
                                {
                                    marketPrices && props.quoteToken && marketPrices.denom.toUpperCase() !== props.quoteToken.metadata.display?.toUpperCase() &&
                                    <Box flex={1} display={"flex"} flexDirection={"row"} justifyContent={"flex-end"}>
                                        <Box><Text fontSize={'$xs'} fontWeight={"$hairline"}
                                                   color={"$textSecondary"}>~ {formatUsdAmount(marketPrices.quote.multipliedBy(volume))} {marketPrices.denom.toUpperCase()}</Text></Box>
                                    </Box>
                                }
                            </Stack>
                            <Stack space="$5" attributes={{width: "15%", justifyContent: "flex-end"}}>
                                {!!props.onWithdraw && props.showWithdraw &&
                                    <Button intent="text" size="sm" onClick={(event) => props?.onWithdraw?.(event)}>
                                        {props.withdrawLabel}
                                    </Button>
                                }
                            </Stack>
                        </Stack>
                    </> :
                    <>
                        <Box display={'flex'} flex={1} justifyContent={'center'}
                             alignItems={'center'}><Text>Loading...</Text></Box>
                    </>
            }
        </Stack>
    );
}