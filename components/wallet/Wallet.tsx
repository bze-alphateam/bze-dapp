import {Box, ClipboardCopyText,} from "@interchain-ui/react";
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
import {getChainName} from "@/utils";

export function Wallet() {
    const {
        chain,
        status,
        wallet,
        username,
        address,
        message,
        connect,
        openView,
        assets,
    } = useChain(getChainName());

    console.log("assets", assets);
    console.log("message", message);

    const ConnectButton = {
        [WalletStatus.Connected]: <ButtonConnected onClick={openView} text={username}/>,
        [WalletStatus.Connecting]: <ButtonConnecting/>,
        [WalletStatus.Disconnected]: <ButtonDisconnected onClick={connect}/>,
        [WalletStatus.Error]: <ButtonError onClick={openView}/>,
        [WalletStatus.Rejected]: <ButtonRejected onClick={connect}/>,
        [WalletStatus.NotExist]: <ButtonNotExist onClick={openView}/>,
    }[status] || <ButtonConnect onClick={connect}/>;

    return (
        <Box display={"flex"} gap={"$6"}>
            <Box maxWidth={"$auto"}>
                {address
                    ? <ClipboardCopyText text={address} truncate="middle"/>
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
