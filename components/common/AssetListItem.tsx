import {Token} from "@/services";
import {uAmountToAmount} from "@/utils";
import {CoinSDKType} from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";
import {BaseComponentProps, Box, Button, Stack, Text} from "@interchain-ui/react";
import {useMemo} from "react";
import {useRouter} from "next/router";

export interface CustomAssetListItemProps extends BaseComponentProps {
    token: Token;
    balance?: CoinSDKType | undefined;
    depositLabel?: string;
    withdrawLabel?: string;
    showDeposit?: boolean;
    showWithdraw?: boolean;
    onDeposit?: (event?: any) => void;
    onWithdraw?: (event?: any) => void;
}

export default function AssetListItem(props: CustomAssetListItemProps) {

    const router = useRouter();

    const onTickerClick = () => {
        router.push({
            pathname: '/token',
            query: {
                denom: props.token.metadata.base
            }
        });
    }

    const prettyDisplayBalance = useMemo(() => {
        if (!props.balance) {
            return "";
        }

        const tokenDisplayDenom = props.token.metadata.denom_units.find((unit) => unit.denom === props.token.metadata.display);
        if (!tokenDisplayDenom) {
            return "";
        }

        return `${uAmountToAmount(props.balance.amount, tokenDisplayDenom.exponent)} ${tokenDisplayDenom.denom.toUpperCase()}`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.balance])

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
                        src: props.token.logo,
                        onError: (e: { currentTarget: { src: string; }; }) => (e.currentTarget.src = "/token_placeholder.png"),
                    }}
                    width={"$14"}
                    height={"$14"}
                />
            </Box>
            <Stack attributes={{alignItems: "center", flex: 1}}>
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
                        attributes={{marginBottom: "$2"}}
                    >
                        {props.token.metadata.name}
                    </Text>
                    <Box>
                        <Button size={'xs'} intent={'text'} iconSize={'$md'} attributes={{borderWidth: '$sm'}} leftIcon={'coinsLine'} onClick={onTickerClick}>
                            {props.token.metadata.symbol}
                        </Button>
                    </Box>
                </Stack>
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
                        attributes={{marginBottom: "$2"}}
                    >
                        {props.token.verified ? '✅ Verified' : '❌ Not Verified'}
                    </Text>
                    <Text fontSize={'$sm'} color="$textSecondary">
                        {props.token.type} Token
                    </Text>
                </Stack>
                <Stack
                    space="$0"
                    direction="vertical"
                    attributes={{
                        width: "30%",
                    }}
                >
                    {props.balance &&
                        <>
                            <Text
                                fontSize={'$sm'}
                                fontWeight="$semibold"
                                attributes={{marginBottom: "$2"}}
                            >
                                {prettyDisplayBalance}
                            </Text>
                            <Text fontSize={'$sm'} color="$textSecondary">
                                Balance
                            </Text>
                        </>
                    }
                </Stack>
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
                            leftIcon={'plusRound'}
                        >
                            {props.depositLabel}
                        </Button>
                    }

                    {!!props.onWithdraw && props.showWithdraw &&
                        <Button
                            intent="text"
                            size="sm"
                            onClick={(event) => props?.onWithdraw?.(event)}
                            leftIcon={'minusRound'}
                        >
                            {props.withdrawLabel}
                        </Button>
                    }
                    <Button
                        intent="secondary"
                        size="sm"
                        onClick={(event) => onTickerClick()}
                    >
                        {"View"}
                    </Button>
                </Stack>
            </Stack>
        </Stack>
    );
}