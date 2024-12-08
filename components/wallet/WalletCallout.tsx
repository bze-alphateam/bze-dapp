import {Callout} from "@interchain-ui/react";

interface WalletConnectCalloutProps {
    text: string,
}

export default function WalletConnectCallout({props}: { props: WalletConnectCalloutProps }) {
    return (
        <Callout
            attributes={{
                width: '$auto',
            }}
            iconName="walletFilled"
            intent="none"
            title="No wallet connected"
        >
            {props.text}
        </Callout>
    );
}
