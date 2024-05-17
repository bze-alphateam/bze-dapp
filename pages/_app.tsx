import "../styles/globals.css";
import "@interchain-ui/react/styles";

import type { AppProps } from "next/app";
import { SignerOptions } from "cosmos-kit";
import { wallets as keplrWallets } from '@cosmos-kit/keplr';
import { ChainProvider } from "@cosmos-kit/react";
import {
  Box,
  ThemeProvider,
  useColorModeValue,
  useTheme,
  Toaster,
} from "@interchain-ui/react";
import { ASSETS, CHAINS } from "@/config";
import { GasPrice } from '@cosmjs/stargate';

function CreateCosmosApp({ Component, pageProps }: AppProps) {
  const { themeClass } = useTheme();

  const signerOptions: SignerOptions = {
    preferredSignType: (chainName) => {
      return 'direct'
    }
  };

  return (
    <ThemeProvider>
      <ChainProvider
        chains={CHAINS}
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
          <Toaster position="top-right" closeButton={true} />
        </Box>
      </ChainProvider>
    </ThemeProvider>
  );
}

export default CreateCosmosApp;
