
const MAINNET_CHAIN_INFO_FALLBACK = {
  "chainId": "beezee-1",
  "chainName": "BeeZee",
  "chainSymbolImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/beezee/chain.png",
  "rpc": "https://rpc.getbze.com",
  "rest": "https://rest.getbze.com",
  "nodeProvider": {
      "name": "BZE Alpha Team",
      "email": "alphateam@getbze.com",
      "website":"https://getbze.com"
  },
  "stakeCurrency": {
      "coinDenom": "BZE",
      "coinMinimalDenom": "ubze",
      "coinDecimals": 6,
      "coinGeckoId": "bzedge",
      "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/beezee/chain.png"
  },
  "bip44": {
      "coinType": 118
  },
  "bech32Config": {
    "bech32PrefixAccAddr": "bze",
    "bech32PrefixAccPub": "bzepub",
    "bech32PrefixValAddr": "bzevaloper",
    "bech32PrefixValPub": "bzevaloperpub",
    "bech32PrefixConsAddr": "bzevalcons",
    "bech32PrefixConsPub": "bzevalconspub"
  },
  "currencies": [
    {
      "coinDenom": "BZE",
      "coinMinimalDenom": "ubze",
      "coinDecimals": 6,
      "coinGeckoId": "bzedge",
      "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/beezee/chain.png"
    },
		{
      "coinDenom": "VDL",
      "coinMinimalDenom": "factory/bze13gzq40che93tgfm9kzmkpjamah5nj0j73pyhqk/uvdl",
      "coinDecimals": 6,
      "coinGeckoId": "vidulum",
      "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/beezee/factory/bze13gzq40che93tgfm9kzmkpjamah5nj0j73pyhqk/uvdl.png"
    }
	],
  "feeCurrencies": [{
      "coinDenom": "BZE",
      "coinMinimalDenom": "ubze",
      "coinDecimals": 6,
      "coinGeckoId": "bzedge",
      "gasPriceStep": {
          "low": 0.001,
          "average": 0.01,
          "high": 0.1
      },
      "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/beezee/chain.png"
  }],
  "features": [
  ]
};

const TESTNET_CHAIN_INFO_FALLBACK = {
  "chainId": "bzetestnet-2",
  "chainName": "BeeZee Testnet",
  "chainSymbolImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/bzetestnet/chain.png",
  "rpc": "https://testnet-rpc.getbze.com",
  "rest": "https://testnet.getbze.com",
  "nodeProvider": {
      "name": "BZE Alpha Team",
      "email": "alphateam@getbze.com",
      "website":"https://getbze.com"
  },
  "stakeCurrency": {
      "coinDenom": "TBZE",
      "coinMinimalDenom": "utbz",
      "coinDecimals": 6,
      "coinGeckoId": "bzedge",
      "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/bzetestnet/chain.png"
  },
  "bip44": {
      "coinType": 118
  },
  "bech32Config": {
    "bech32PrefixAccAddr": "testbz",
    "bech32PrefixAccPub": "testbzpub",
    "bech32PrefixValAddr": "testbzvaloper",
    "bech32PrefixValPub": "testbzvaloperpub",
    "bech32PrefixConsAddr": "testbzvalcons",
    "bech32PrefixConsPub": "testbzvalconspub"
  },
  "currencies": [
    {
      "coinDenom": "TBZE",
      "coinMinimalDenom": "utbz",
      "coinDecimals": 6,
      "coinGeckoId": "bzedge",
      "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/bzetestnet/chain.png"
    },
		{
      "coinDenom": "TVDL",
      "coinMinimalDenom": "factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/vidulum",
      "coinDecimals": 6,
      "coinGeckoId": "vidulum",
      "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/bzetestnet/factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/vidulum.png"
    }
  ],
  "feeCurrencies": [{
      "coinDenom": "TBZE",
      "coinMinimalDenom": "utbz",
      "coinDecimals": 6,
      "coinGeckoId": "bzedge",
      "gasPriceStep": {
          "low": 0.001,
          "average": 0.01,
          "high": 0.1
      },
      "coinImageUrl": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/bzetestnet/chain.png"
  }],
  "features": [
  ]
};

async function getKeplrMainnetChainInfo() {
  const localKey = 'ci:keplr:mainnet';
  const expKey = 'ci:keplr:mainnet:expire';
  // Check if cache exists and is valid
  const cachedData = localStorage.getItem(localKey);
  const cacheExpiry = localStorage.getItem(expKey);
  if (cachedData && cacheExpiry && new Date().getTime() < new Date(parseInt(cacheExpiry)).getTime()) {
      return JSON.parse(cachedData);
  }

  const url = 'https://raw.githubusercontent.com/faneaatiku/keplr-chain-registry/main/cosmos/beezee.json';
  try {
      const response = await fetch(url);
      if (!response.ok) {
          console.error(`HTTP error when fetching mainnet keplr data. status: ${response.status}`);
          
          return MAINNET_CHAIN_INFO_FALLBACK;
      }

      const json = await response.json();
      // Cache the new data
      localStorage.setItem(localKey, JSON.stringify(json));
      //save expiration
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + (60 * 24));
      localStorage.setItem(expKey, expiryDate.getTime().toString());

      return json;
  } catch (error) {
      console.error(`Error fetching mainnet keplr data from ${url}:`, error);
      return MAINNET_CHAIN_INFO_FALLBACK;
  }
}

async function getKeplrTestnetChainInfo() {
  const localKey = 'ci:keplr:testnet';
  const expKey = 'ci:keplr:testnet:expire';
  // Check if cache exists and is valid
  const cachedData = localStorage.getItem(localKey);
  const cacheExpiry = localStorage.getItem(expKey);
  if (cachedData && cacheExpiry && new Date().getTime() < new Date(parseInt(cacheExpiry)).getTime()) {
      return JSON.parse(cachedData);
  }

  const url = 'https://raw.githubusercontent.com/faneaatiku/keplr-chain-registry/main/cosmos/bzetestnet.json';
  try {
      const response = await fetch(url);
      if (!response.ok) {
          console.error(`HTTP error when fetching testnet keplr data. status: ${response.status}`);
          
          return TESTNET_CHAIN_INFO_FALLBACK;
      }

      const json = await response.json();
      // Cache the new data
      localStorage.setItem(localKey, JSON.stringify(json));
      //save expiration
      const expiryDate = new Date();
      expiryDate.setMinutes(expiryDate.getMinutes() + (60 * 24));
      localStorage.setItem(expKey, expiryDate.getTime().toString());

      return json;
  } catch (error) {
      console.error(`Error fetching testnet keplr data from ${url}:`, error);
      return TESTNET_CHAIN_INFO_FALLBACK;
  }
}

async function getKeplrChainInfo(chainId: string) {
  if (chainId !== 'beezee') {
    return getKeplrTestnetChainInfo();
  }

  return getKeplrMainnetChainInfo();
}

export async function keplrSuggestChain(chainId: string) {
  {/* @ts-ignore */}
  return await window.keplr?.experimentalSuggestChain(await getKeplrChainInfo(chainId))
}
