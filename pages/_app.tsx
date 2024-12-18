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
                        projectId: "a8510432ebb71e6948cfd6cde54b70f7",
                        relayUrl: "wss://relay.walletconnect.org",
                        metadata: {
                            name: "CosmosKit Template",
                            description: "CosmosKit dapp template",
                            url: "https://docs.cosmology.zone/cosmos-kit/",
                            icons: [],
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
