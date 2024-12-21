import "../styles/globals.css";
import "@interchain-ui/react/styles";
// import '@interchain-ui/react/globalStyles';
import type {AppProps} from "next/app";
import {SignerOptions} from "cosmos-kit";
import {wallets as keplrWallets} from '@cosmos-kit/keplr';
import {ChainProvider} from "@cosmos-kit/react";
import {Box, ThemeProvider, Toaster, useColorModeValue, useTheme,} from "@interchain-ui/react";
import {ASSETS, CHAINS} from "@/config";
import {chains} from "chain-registry";
import {useCallback} from "react";


function CreateCosmosApp({Component, pageProps}: AppProps) {
    const {themeClass} = useTheme();

    const signerOptions: SignerOptions = {
        preferredSignType: (chainName) => {
            return 'direct'
        }
    };

    const getChains = useCallback(() => {
        return chains.filter(chain => chain.network_type === "mainnet")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chains])

    return (
        <ThemeProvider>
            <ChainProvider
                chains={[...getChains(), ...CHAINS]}
                // @ts-ignore
                assetLists={ASSETS}
                wallets={[...keplrWallets]}
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
