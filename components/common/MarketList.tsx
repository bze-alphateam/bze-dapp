import {Ticker} from "@/services";
import {AssetListItem as InterchainAssetListItem, BaseComponentProps, Box, Stack, Text} from "@interchain-ui/react";
import MarketListItem, {MarketListItemProps} from "./MarketListItem";

export interface MarketListProps extends BaseComponentProps {
    list: MarketListItemProps[];
    tickers?: Map<string, Ticker>;
    attributes?: any;
}

export default function MarketsList(props: MarketListProps) {
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
                    <Box width="$22"/>
                    <Stack space="$0" attributes={{marginBottom: "$12", flex: 1}}>
                        <Text attributes={{width: "20%"}} color="$textSecondary">
                            Market
                        </Text>
                        <Box width="15%"></Box>
                        <Text attributes={{width: "35%"}} color="$textSecondary">
                            24h Price
                        </Text>
                        <Box width="25%"></Box>
                        <Text attributes={{width: "35%"}} color="$textSecondary">
                            24h Volume
                        </Text>
                    </Stack>
                </Stack>

                <Stack space="$10" direction="vertical">
                    {props.list.map((item: MarketListItemProps, index: number) => (
                        <Box key={index}>
                            <MarketListItem
                                showWithdraw={true}
                                onWithdraw={() => item?.onWithdraw?.()}
                                withdrawLabel={item.withdrawLabel ?? InterchainAssetListItem.defaultProps.withdrawLabel}
                                baseToken={item.baseToken}
                                quoteToken={item.quoteToken}
                                tickers={props.tickers}
                            />
                        </Box>
                    ))}
                </Stack>
            </Box>
        </Box>
    );
}