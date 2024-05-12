
import { AssetListItemProps, Box, Button, Stack, Text } from "@interchain-ui/react";

export default function AssetListItem(props: AssetListItemProps) {
  console.log("props", props);
  return (
    <Stack
      attributes={{
        minWidth: "720px",
        alignItems: "center",
      }}
      className={props.className}
    >
      <Box width="$19">
        <Box
          as="img"
          attributes={{
            src: props.imgSrc,
          }}
          width={props.isOtherChains ? "$10" : "$14"}
          height={props.isOtherChains ? "$10" : "$14"}
        />
      </Box>
      <Stack attributes={{ alignItems: "center", flex: 1 }}>
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
            {props.symbol}
          </Text>
          <Text fontSize={'$sm'} color="$textSecondary">
            {props.name}
          </Text>
        </Stack>
        {props.needChainSpace &&
          <Stack
            attributes={{
              width: "25%",
            }}
          >
            {props.isOtherChains && 
              <Text fontSize={'$sm'} color="$textSecondary">
                {props.chainName}
              </Text>
            }
          </Stack>
        }
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
            {props.tokenAmount}
          </Text>
          <Text fontSize={'$sm'} color="$textSecondary">
            {props.tokenAmountPrice}
          </Text>
        </Stack>

        {!props.needChainSpace && 
          <Stack
            attributes={{
              width: "25%",
            }}
          ></Stack>
        }

        <Stack
          space="$5"
          attributes={{
            width: "25%",
            justifyContent: "flex-end",
          }}
        >
          {!!props.onDeposit && props.showDeposit &&
            <Button
              intent="text"
              size="sm"
              onClick={(event) => props?.onDeposit?.(event)}
            >
              {props.depositLabel}
            </Button>
          }

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