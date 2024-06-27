
import { Token } from "@/services";
import AssetListItem, { CustomAssetListItemProps } from "./AssetListItem";
import { AssetListItemProps, Box, Stack, Text, AssetListItem as InterchainAssetListItem, BaseComponentProps } from "@interchain-ui/react";
import { CoinSDKType } from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";

interface CustomAssetListProps extends BaseComponentProps{
  list: CustomAssetListItemProps[];
  balances?: CoinSDKType[];
  titles?: [string, string];
  attributes?: any;
}

export default function AssetList(props: CustomAssetListProps) {
  return (
    <Box
      overflowX={{
        mobile: "scroll",
        tablet: "auto",
        desktop: "auto",
      }}
      className={props.className}
      {...props.attributes}
    >
      <Box display="flex" flexDirection="column" minWidth="720px">
        <Stack>
          <Box width="$19" />
          <Stack space="$0" attributes={{ marginBottom: "$12", flex: 1 }}>
            <Text attributes={{ width: "25%" }} color="$textSecondary">
              {props.titles?.[0]}
            </Text>
            <Box width="25%"></Box>
            <Text attributes={{ width: "25%" }} color="$textSecondary">
              {props.titles?.[1]}
            </Text>
          </Stack>
        </Stack>

        <Stack space="$10" direction="vertical">
          {props.list.map((item: CustomAssetListItemProps, index: number) => {
              const balance = props.balances?.find((coin: CoinSDKType) => coin.denom === item.token.metadata.base);

              return (
                <Box key={item.token.metadata.base}>
                  <AssetListItem
                    token={item.token}
                    balance={balance}
                    showDeposit={item.showDeposit}
                    showWithdraw={item.showWithdraw}
                    onDeposit={() => item?.onDeposit?.()}
                    onWithdraw={() => item?.onWithdraw?.()}
                    withdrawLabel={item.withdrawLabel ?? InterchainAssetListItem.defaultProps.withdrawLabel}
                    depositLabel={item.depositLabel ?? InterchainAssetListItem.defaultProps.depositLabel}
                  />
                </Box>
              );
            })}
        </Stack>
      </Box>
    </Box>
  );
}