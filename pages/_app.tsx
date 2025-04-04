import "../styles/globals.css";
import "@interchain-ui/react/styles";
// import '@interchain-ui/react/globalStyles';
import type {AppProps} from "next/app";
import {SignerOptions} from "cosmos-kit";
import {wallets as keplrWallets} from '@cosmos-kit/keplr';
import {wallets as leapWallets} from '@cosmos-kit/leap';
import {ChainProvider} from "@cosmos-kit/react";
import {Box, ThemeProvider, Toaster, useColorModeValue, useTheme,} from "@interchain-ui/react";
import {getMainnetChains, getTestnetChains, keplrSuggestChain, networks} from "@/config";
import {useCallback, useEffect} from "react";
import {getChainName, isTestnet} from "@/utils";
import {SessionOptions} from "@cosmos-kit/core";


function CreateCosmosApp({Component, pageProps}: AppProps) {
    const {themeClass} = useTheme();

    const signerOptions: SignerOptions = {
        preferredSignType: (chainName) => {
            return 'direct'
        }
    };

    const sessionOptions: SessionOptions = {
        duration: 48 * 60 * 60 * 1000,
    }

    const getAssets = useCallback(() => {
        if (isTestnet()) {
            return networks.testnet.assets
        }

        return networks.mainnet.assets
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])


    const getChains = useCallback(() => {
        if (isTestnet()) {
            return getTestnetChains();
        }

        return getMainnetChains();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        keplrSuggestChain(getChainName());
    }, [])

    return (
        <ThemeProvider
            defaultTheme={"dark"}
        >
            <ChainProvider
                // @ts-ignore
                chains={getChains()}
                // @ts-ignore
                assetLists={getAssets()}
                wallets={[...keplrWallets, ...leapWallets]}
                walletConnectOptions={{
                    signClient: {
                        projectId: "7e8510ae772ef527bd711c9bc02f0cb7",
                        metadata: {
                            name: "BeeZee dApp",
                            description: "DEX & More",
                            url: "https://app.getbze.com",
                            icons: [
                                "https://app.getbze.com/logo_320px.png",
                            ],
                        },
                    },
                }}
                // @ts-ignore
                signerOptions={signerOptions}
                sessionOptions={sessionOptions}
            >
                <Box
                    className={themeClass}
                    minHeight="100dvh"
                    backgroundColor={useColorModeValue("$white", "$background")}
                >
                    {/* TODO fix type error */}
                    {/* @ts-ignore */}
                    <Component {...pageProps} />
                    <Toaster position="top-right" closeButton={true}/>
                </Box>
            </ChainProvider>
        </ThemeProvider>
    );
}

export default CreateCosmosApp;
