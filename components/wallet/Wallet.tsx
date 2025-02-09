import {Box, ClipboardCopyText, Text,} from "@interchain-ui/react";
import {WalletStatus} from "cosmos-kit";
import {useChain} from "@cosmos-kit/react";
import {Warning} from "./Warning";
import {
    ButtonConnect,
    ButtonConnected,
    ButtonConnecting,
    ButtonDisconnected,
    ButtonError,
    ButtonNotExist,
    ButtonRejected,
} from "./Connect";
import {
    getBzeDenomExponent,
    getChainName,
    getCurrentuDenom,
    prettyAmount,
    toPrettyDenom,
    uAmountToAmount
} from "@/utils";
import {useEffect, useState} from "react";
import {getAddressBalances, removeBalancesCache} from "@/services/data_provider/Balances";
import AddressBalanceListener from "@/services/listener/BalanceListener";

export function Wallet() {
    const {
        status,
        wallet,
        username,
        address,
        message,
        connect,
        openView,
    } = useChain(getChainName());

    const [balance, setBalance] = useState<string>("0");

    const ConnectButton = {
        [WalletStatus.Connected]: <ButtonConnected onClick={openView} text={username}/>,
        [WalletStatus.Connecting]: <ButtonConnecting/>,
        [WalletStatus.Disconnected]: <ButtonDisconnected onClick={connect}/>,
        [WalletStatus.Error]: <ButtonError onClick={openView}/>,
        [WalletStatus.Rejected]: <ButtonRejected onClick={connect}/>,
        [WalletStatus.NotExist]: <ButtonNotExist onClick={openView}/>,
    }[status] || <ButtonConnect onClick={connect}/>;

    useEffect(() => {
        const fetchBzeBalance = async (addr: string) => {
            const allBalances = await getAddressBalances(addr);
            const found = allBalances.balances.find((bal) => bal.denom === getCurrentuDenom());
            if (!found) {
                setBalance("0");

                return;
            }

            setBalance(found.amount);
        }

        if (address) {
            fetchBzeBalance(address);
            AddressBalanceListener.setAddress(address);
            AddressBalanceListener.addOnSendAndReceiveCallback(async () => {
                await removeBalancesCache(address);
                await fetchBzeBalance(address);
            });
            AddressBalanceListener.start();
        } else {
            AddressBalanceListener.stop();
        }
    }, [address]);

    return (
        <Box display={"flex"} gap={"$6"}>
            <Box maxWidth={"$auto"}>
                {address && balance ?
                    (<Box>
                        <ClipboardCopyText text={address} truncate="middle"></ClipboardCopyText>
                        <Box mt={"$2"} display={'flex'} justifyContent={"center"} alignItems={"center"}>
                            <Text fontSize={"$xs"} fontWeight={"$bold"} color={"$accentText"}>{prettyAmount(uAmountToAmount(balance, getBzeDenomExponent()))} {toPrettyDenom(getCurrentuDenom()).toUpperCase()}</Text>
                        </Box>
                    </Box>)
                : null}
            </Box>
            <Box maxWidth={"$auto"}>
                {ConnectButton}
            </Box>
            <Box maxWidth={"$auto"}>
                {message && [WalletStatus.Error, WalletStatus.Rejected].includes(status)
                    ? <Warning text={`${wallet?.prettyName}: ${message}`}/>
                    : null}
            </Box>
        </Box>
    );
}
