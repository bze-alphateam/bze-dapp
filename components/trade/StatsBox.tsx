import {formatUsdAmount, MarketPrices} from "@/services";
import {DefaultBorderedBox} from "@/components";
import {Icon, Text} from "@interchain-ui/react";
import {prettyAmount} from "@/utils";


export const PriceBox = ({ price, change, denom, marketPrice }: { price: number; change: number, denom: string, marketPrice: MarketPrices|undefined }) => (
    <DefaultBorderedBox
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p="$4"
        border="1px solid"
        borderColor="$gray200"
        borderRadius="$md"
        width={{desktop: '24%', mobile: '100%'}}
    >
        <Text fontSize="$xs" fontWeight="$thin">
            Price
        </Text>
        <Text fontSize="$xs" fontWeight="$semibold" color={change >= 0 ? "$green200" : "$red200"}>
            {price} {denom.toUpperCase()} ({change > 0.0 ? "+" : ""}{change}%){change >= 0.0 ? <Icon name="arrowUpS"/> : <Icon name="arrowDownS"/>}
        </Text>
        {marketPrice && denom.toUpperCase() !== marketPrice?.denom.toUpperCase() &&
            <Text fontSize="$xs" fontWeight="$thin" color={change >= 0 ? "$green200" : "$red200"}>
                (~{formatUsdAmount(marketPrice.quote.multipliedBy(price))} {marketPrice.denom.toUpperCase()})
            </Text>
        }
    </DefaultBorderedBox>
);

export const StatsBox = ({ title, value, denom, marketPrice }: { title: string; value: string|number, denom: string, marketPrice: MarketPrices|undefined }) => (
    <DefaultBorderedBox
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p="$4"
        border="1px solid"
        borderColor="$gray200"
        borderRadius="$md"
        width={{desktop: '24%', mobile: '100%'}}
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


export const VolumeBox = ({ title, value, denom, marketPrice }: { title: string; value: string|number, denom: string, marketPrice: MarketPrices|undefined }) => (
    <DefaultBorderedBox
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p="$4"
        border="1px solid"
        borderColor="$gray200"
        borderRadius="$md"
        width={{desktop: '24%', mobile: '100%'}}
    >
        <Text fontSize="$xs" fontWeight="$thin">
            {title}
        </Text>
        <Text fontSize="$xs" fontWeight="$semibold" color="$primary200">
            {prettyAmount(value)} {denom.toUpperCase()}
        </Text>
        {marketPrice && denom.toUpperCase() !== marketPrice?.denom.toUpperCase() &&
            <Text fontSize="$xs" fontWeight="$thin" color="$primary200">
                (~{formatUsdAmount(marketPrice.base.multipliedBy(value))} {marketPrice.denom.toUpperCase()})
            </Text>
        }
    </DefaultBorderedBox>
);
