import {ClickableBox, DefaultBorderedBox} from "@/components";
import {Box, Stack, Text} from "@interchain-ui/react";
import {memo, useEffect, useState} from "react";
import {getAllMarkets, getAllSupplyTokens, getAllTickers, getAssetMarkets, isIBCType, Ticker, Token} from "@/services";
import {MarketSDKType} from "@bze/bzejs/types/codegen/beezee/tradebin/market";
import {marketIdFromDenoms} from "@/utils";
import {PriceText} from "@/components/common/MarketListItem";
import {useRouter} from "next/router";
import {EXCLUDED_MARKETS} from "@/config/verified";

function EmptyTokenMarkets({props}: {props: {text: string}}) {
    return (
        <Box p={"$12"} m={"$6"} justifyContent={"center"} textAlign={"center"}>
            <Text>
                {props.text}
            </Text>
        </Box>
    );
}

interface MarketBoxProps {
    market: MarketSDKType;
    base: Token;
    quote: Token;
    ticker?: Ticker|undefined;
}

function MarketBox({props}: {props: MarketBoxProps}) {

    const router = useRouter();

    const onClick = () => {
        router.push({
            pathname: '/trade/market',
            query: {
                base: props.base.metadata.base,
                quote: props.quote.metadata.base,
            }
        });
    }

    return (
        <ClickableBox onClick={onClick}>
            <Box p={"$4"} m={"$2"} display={"flex"} justifyContent={"center"} alignItems={"center"} flexDirection={"row"}>
                <Box as="img" attributes={{src: props.base.logo}} width={"$14"} height={"$14"}/>
                <Box as="img" attributes={{src: props.quote.logo}} width={"$14"} height={"$14"}/>
                <Box flex={1} justifyContent={"center"} flexDirection={"column"} ml={"$2"}>
                    <Box>
                        <Text fontSize={'$sm'} fontWeight="$semibold" attributes={{marginBottom: "$2"}}>
                            {props.base.metadata.symbol}/{props.quote.metadata.symbol}
                        </Text>
                    </Box>
                    {
                        props.ticker &&
                        <Box>
                            <PriceText props={{
                                quoteDenom: props.quote.metadata.display.toUpperCase(),
                                lastPrice: props.ticker.last_price,
                                priceChange: props.ticker.change,
                            }}/>
                        </Box>
                    }
                </Box>
            </Box>
        </ClickableBox>
    );
}

interface MarketsBoxProps {
    markets: MarketSDKType[];
    tokens: Map<string, Token>;
    tickers?: Map<string, Ticker>;
}

function MarketsCollection({props}: {props: MarketsBoxProps}) {
    if (props.markets.length === 0) {
        return (<EmptyTokenMarkets props={{text: "No markets found..."}}/>);
    }

    return (
        <Box display="flex" flex={1} flexWrap={"wrap"} minWidth={"300px"}>
            {props.markets.map(market => {
                const base = props.tokens.get(market.base);
                const quote = props.tokens.get(market.quote);
                if (!quote || !base) {
                    return null;
                }

                let ticker: Ticker|undefined;
                if (props.tickers) {
                    ticker = props.tickers.get(marketIdFromDenoms(base.metadata.base, quote.metadata.base));
                }

                return (<MarketBox key={`${market.base}/${market.quote}`} props={{market: market, base: base, quote: quote, ticker: ticker}} />);
            })}
        </Box>
    );
}

interface TokenMarketsProps {
    denom: string;
}

export const TokenMarkets = memo(({props}: { props: TokenMarketsProps }) => {
    const [loading, setLoading] = useState(true);
    const [markets, setMarkets] = useState<MarketSDKType[]>([]);
    const [tokens, setTokens] = useState<Map<string, Token>>(new Map());
    const [tickers, setTickers] = useState<Map<string, Ticker>>(new Map());

    const loadData = async () => {
        if (!props.denom || props.denom == "") {
            return;
        }

        const [markets, tokens, tick] = await Promise.all([getAssetMarkets(props.denom), getAllSupplyTokens(), getAllTickers()]);
        //merge markets: first markets where the asset is quote asset, then those where it's base asset
        const mergedMarkets = markets.quote.filter((market: MarketSDKType) => !EXCLUDED_MARKETS[marketIdFromDenoms(market.base, market.quote)]);
        mergedMarkets.push(...markets.base.filter((market: MarketSDKType) => !EXCLUDED_MARKETS[marketIdFromDenoms(market.base, market.quote)]));

        setMarkets(mergedMarkets);
        setTokens(tokens)
        setTickers(tick);

        setLoading(false);
    }

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <DefaultBorderedBox mb='$12'>
                <EmptyTokenMarkets props={{text: "Loading markets..."}}/>
            </DefaultBorderedBox>
        );
    }

    return (
        <DefaultBorderedBox mb='$12'>
            <Box p='$6' mb='$2'>
                <Text as='h3' fontSize={'$lg'} textAlign={'center'} color={'$primary200'}>Markets</Text>
            </Box>
            <MarketsCollection props={{
                markets: markets,
                tokens: tokens,
                tickers: tickers,
            }} />
        </DefaultBorderedBox>
    );
});

TokenMarkets.displayName = 'TokenMarkets';
