
import AssetListItem from "./AssetListItem";
import { AssetListItemProps, AssetListProps, Box, Stack, Text, AssetListItem as InterchainAssetListItem } from "@interchain-ui/react";

export default function AssetList(props: AssetListProps) {
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
            {props.needChainSpace &&
              <Box width="25%">
                {props.isOtherChains && 
                  <Text color="$textSecondary">Chain</Text>
                
                }
              </Box>
            }
            <Text attributes={{ width: "25%" }} color="$textSecondary">
              {props.titles?.[1]}
            </Text>
          </Stack>
        </Stack>

        <Stack space="$10" direction="vertical">
          {props.list.map((item: AssetListItemProps, index: number) => (
              <Box key={index}>
                <AssetListItem
                  needChainSpace={props.needChainSpace}
                  isOtherChains={props.isOtherChains}
                  imgSrc={item.imgSrc}
                  symbol={item.symbol}
                  name={item.name}
                  tokenAmount={item.tokenAmount}
                  tokenAmountPrice={item.tokenAmountPrice}
                  chainName={item?.chainName}
                  showDeposit={item.showDeposit}
                  showWithdraw={item.showWithdraw}
                  onDeposit={() => item?.onDeposit?.()}
                  onWithdraw={() => item?.onWithdraw?.()}
                  withdrawLabel={item.withdrawLabel ?? InterchainAssetListItem.defaultProps.withdrawLabel}
                  depositLabel={item.depositLabel ?? InterchainAssetListItem.defaultProps.depositLabel}
                />
              </Box>
            ))}
        </Stack>
      </Box>
    </Box>
  );
}