import { Token, Ticker } from "@/services";
import {BaseComponentProps, Box, Button, Icon, Stack, Text} from "@interchain-ui/react";
import {useEffect, useState} from "react";
import {marketIdFromDenoms, prettyAmount} from "@/utils";

export interface MarketListItemProps extends BaseComponentProps {
  withdrawLabel?: string;
  showWithdraw?: boolean;
  onWithdraw?: (event?: any) => void;
  baseToken?: Token;
  quoteToken?: Token;
  tickers?: Map<string, Ticker>;
}

// needChainSpace={true}
// isOtherChains={false}
export default function MarketListItem(props: MarketListItemProps) {
  const [priceChange, setPriceChange] = useState(0.00);
  const [lastPrice, setLastPrice] = useState(0);
  const [volume, setVolume] = useState(0);

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
    }

  }, [props.tickers]);

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
            <Box
              as="img"
              attributes={{
                src: props.baseToken.logo,
              }}
              width={"$14"}
              height={"$14"}
            />
            <Box
              as="img"
              attributes={{
                src: props.quoteToken.logo,
              }}
              width={"$14"}
              height={"$14"}
            />
          </Box>
          <Stack attributes={{ alignItems: "center", flex: 1 }}>
            <Stack
              space="$0"
              direction="vertical"
              attributes={{
                width: "20%",
              }}
            >
              <Text
                fontSize={'$sm'}
                fontWeight="$semibold"
                attributes={{ marginBottom: "$2" }}
              >
                {props.baseToken.metadata.symbol}/{props.quoteToken.metadata.symbol}
              </Text>
              <Text fontSize={'$sm'} color="$textSecondary">
                {props.baseToken.verified && props.quoteToken.verified ? '✅ Verified' : '❌ Not verified'}
              </Text>
            </Stack>
            <Stack
              attributes={{
                width: "10%",
              }}
            >
            </Stack>
            <Stack
              space="$0"
              direction="vertical"
              attributes={{
                width: "40%",
              }}
            >
              <Text
                fontSize={'$sm'}
                attributes={{ marginBottom: "$2" }}
                color={priceChange >= 0.0 ? "$green200" : "$red200"}
                fontWeight={"$semibold"}
              >
                Price: {lastPrice} {props.quoteToken?.metadata.display?.toUpperCase()} ({priceChange > 0.0 ? "+" : ""}{priceChange}%){priceChange >= 0.0 ? <Icon name="arrowUpS"/> : <Icon name="arrowDownS"/>}
              </Text>
              <Text
                fontSize={'$sm'}
                fontWeight="$hairline"
                color="$textSecondary">
                Volume: {prettyAmount(volume)} {props.quoteToken?.metadata.display?.toUpperCase()}
              </Text>

            </Stack>
            <Stack
              space="$5"
              attributes={{
                width: "25%",
                justifyContent: "flex-end",
              }}
            >
              {!!props.onWithdraw && props.showWithdraw &&
              <Button
                intent="text"
                size="sm"
                onClick={(event) => props?.onWithdraw?.(event)}
              >
                {props.withdrawLabel}
              </Button>
              }
            </Stack>
          </Stack>
        </> :
        <>
          <Box display={'flex'} flex={1} justifyContent={'center'} alignItems={'center'}><Text>Loading...</Text></Box>
        </>
      }
    </Stack>
  );
}