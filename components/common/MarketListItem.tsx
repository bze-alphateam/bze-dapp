
import { Token } from "@/services";
import { BaseComponentProps, Box, Button, Stack, Text } from "@interchain-ui/react";

export interface MarketListItemProps extends BaseComponentProps {
  withdrawLabel?: string;
  showWithdraw?: boolean;
  onWithdraw?: (event?: any) => void;
  baseToken?: Token;
  quoteToken?: Token;
}

// needChainSpace={true}
// isOtherChains={false}
export default function MarketListItem(props: MarketListItemProps) {
  if (props.baseToken === undefined || props.quoteToken === undefined) {
    return null;
  }

  return (
    <Stack
      attributes={{
        minWidth: "720px",
        alignItems: "center",
      }}
      className={props.className}
    >
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
          {/* <Text fontSize={'$sm'} color="$textSecondary">
            {props.baseToken.metadata.name}
          </Text> */}
        </Stack>
        <Stack
          attributes={{
            width: "25%",
          }}
        >
        </Stack>
        <Stack
          space="$0"
          direction="vertical"
          attributes={{
            width: "25%",
          }}
        >
          <Text
            fontSize={'$sm'}
            fontWeight="$semibold"
            attributes={{ marginBottom: "$2" }}
          >
            {props.baseToken.verified && props.quoteToken.verified ? '✅ Verified' : '❌ Not verified'}
          </Text>
          <Text fontSize={'$sm'} color="$textSecondary">
            
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
    </Stack>
  );
}