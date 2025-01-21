import {formatUsdAmount, MarketPrices, Ticker} from "@/services";
import {DefaultBorderedBox} from "@/components";
import {Icon, Text} from "@interchain-ui/react";
import {prettyAmount} from "@/utils";
import {useMemo} from "react";
import {MarketPairTokens} from "@/components/trade/ActiveOrders";


export const PriceBox = ({price, change, denom, marketPrice}: {
    price: number;
    change: number,
    denom: string,
    marketPrice: MarketPrices | undefined
}) => (
    <DefaultBorderedBox
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p="$4"
        border="1px solid"
        borderColor="$gray200"
        borderRadius="$md"
        width={{desktop: '25%', mobile: '100%'}}
    >
        <Text fontSize="$xs" fontWeight="$thin">
            Price
        </Text>
        <Text fontSize="$xs" fontWeight="$semibold" color={change >= 0 ? "$green200" : "$red200"}>
            {price} {denom.toUpperCase()} ({change > 0.0 ? "+" : ""}{change}%){change >= 0.0 ? <Icon name="arrowUpS"/> :
            <Icon name="arrowDownS"/>}
        </Text>
        {marketPrice && denom.toUpperCase() !== marketPrice?.denom.toUpperCase() &&
            <Text fontSize="$xs" fontWeight="$thin" color={change >= 0 ? "$green200" : "$red200"}>
                (~{formatUsdAmount(marketPrice.quote.multipliedBy(price))} {marketPrice.denom.toUpperCase()})
            </Text>
        }
    </DefaultBorderedBox>
);

export const StatsBox = ({title, value, denom, marketPrice}: {
    title: string;
    value: string | number,
    denom: string,
    marketPrice: MarketPrices | undefined
}) => (
    <DefaultBorderedBox
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p="$4"
        border="1px solid"
        borderColor="$gray200"
        borderRadius="$md"
        width={{desktop: '25%', mobile: '100%'}}
    >
        <Text fontSize="$xs" fontWeight="$thin">
            {title}
        </Text>
        <Text fontSize="$xs" fontWeight="$semibold" color="$primary200">
            {value} {denom.toUpperCase()}
        </Text>
        {marketPrice && denom.toUpperCase() !== marketPrice?.denom.toUpperCase() &&
            <Text fontSize="$xs" fontWeight="$thin" color="$primary200">
                (~{formatUsdAmount(marketPrice.quote.multipliedBy(value))} {marketPrice.denom.toUpperCase()})
            </Text>
        }
    </DefaultBorderedBox>
);


export const VolumeBox = ({title, marketPrice, ticker, tokens}: {
    title: string;
    marketPrice: MarketPrices | undefined
    ticker?: Ticker | undefined
    tokens?: MarketPairTokens | undefined
}) => {

    const getDenom = useMemo(() => {
        return tokens?.baseTokenDisplayDenom.denom ?? ""
    }, [tokens])

    const getValue = useMemo(() => {
        if (!ticker) {
            return "0";
        }

        return ticker.base_volume;
    }, [ticker])

    const getUsdValue = useMemo(() => {
        if (!marketPrice) {
            return "0";
        }

        return `${formatUsdAmount(marketPrice.quote.multipliedBy(ticker?.quote_volume ?? "0"))} ${marketPrice.denom.toUpperCase()}`
    }, [marketPrice, ticker])

    return (
        <DefaultBorderedBox
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            p="$4"
            border="1px solid"
            borderColor="$gray200"
            borderRadius="$md"
            width={{desktop: '25%', mobile: '100%'}}
        >
            <Text fontSize="$xs" fontWeight="$thin">
                {title}
            </Text>
            <Text fontSize="$xs" fontWeight="$semibold" color="$primary200">
                {prettyAmount(getValue)} {getDenom.toUpperCase()}
            </Text>
            {marketPrice && ticker && getDenom.toUpperCase() !== marketPrice?.denom.toUpperCase() &&
                <Text fontSize="$xs" fontWeight="$thin" color="$primary200">
                    (~{getUsdValue})
                </Text>
            }
        </DefaultBorderedBox>
    )
}
