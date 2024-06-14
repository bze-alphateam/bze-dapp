import { chains, assets } from 'chain-registry';

const TESTNET_COIN_DENOM = "TBZE";
const TESTNET_COIN_MIN_DENOM = "utbz";
const BZE_PREFIX_TESTNET = "testbz";

const BZE_TESTNET_2_SUGGEST_CHAIN = {
  chain_id: "bzetestnet-2",
  chain_name: "BeeZee Testnet",
  pretty_name: 'BeeZee Testnet',
  network_type: 'mainnet',
  bech32_prefix: BZE_PREFIX_TESTNET,
  status: "live",
  slip44: 118,

  logo_URIs: {
    svg: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg',
  },
  fees: {
    fee_tokens: [
      {
        denom: TESTNET_COIN_MIN_DENOM,
        fixed_min_gas_price: 0
      }
    ]
  },
  key_algos: [
    "secp256k1"
  ],
  staking: {
    staking_tokens: [
        {
          denom: TESTNET_COIN_MIN_DENOM
        }
      ]
  },
  explorers: [
    {
      "kind": "ping.pub",
      "url": "https://testnet.explorer.thesilverfox.pro/beezee",
      "tx_page": "https://testnet.explorer.thesilverfox.pro/beezee/tx/${txHash}"
    }
  ],
  codebase: {
    "git_repo": "https://github.com/bze-alphateam/bze",
    "recommended_version": "v5.1.2",
    "compatible_versions": [
      "v5.1.2"
    ],
    "binaries": {
      "darwin/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-darwin-amd64.tar.gz",
      "darwin/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-darwin-arm64.tar.gz",
      "linux/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-linux-amd64.tar.gz",
      "linux/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-linux-arm64.tar.gz",
      "windows/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-win64.zip"
    },
    "genesis": {
      "genesis_url": "https://raw.githubusercontent.com/bze-alphateam/bze/main/genesis.json"
    }
  },
  apis: {
    "rpc": [
      {
        "address": "https://testnet-rpc.getbze.com",
        "provider": "AlphaTeam"
      }
    ],
    "rest": [
      {
        "address": "https://testnet.getbze.com",
        "provider": "AlphaTeam"
      },
    ],
    "grpc": [
      {
        "address": "grpc.getbze.com:9999",
        "provider": "AlphaTeam"
      }
    ]
  }
};

export const networks = {
  mainnet: {
    base: {
      explorerBaseUrl: 'https://ping.pub/beezee',
      rpcUrl: 'https://rpc.getbze.com',
      restUrl: 'https://rest.getbze.com',
      chainName: 'beezee',
      minDenom: 'ubze'
    },
    chain: chains,
    assets: assets,
  },
  testnet: {
    base: {
      explorerBaseUrl: 'https://explorer.getbze.com/bze%20testnet',
      rpcUrl: 'https://testnet-rpc.getbze.com',
      restUrl: 'https://testnet.getbze.com',
      chainName: BZE_TESTNET_2_SUGGEST_CHAIN.chain_name,
      minDenom: TESTNET_COIN_MIN_DENOM
    },
    chain: [BZE_TESTNET_2_SUGGEST_CHAIN],
    assets: [
      {
        chain_name: BZE_TESTNET_2_SUGGEST_CHAIN.chain_name,
        assets: [
          {
            "description": "BeeZee native blockchain",
            "denom_units": [
              {
                "denom": TESTNET_COIN_MIN_DENOM,
                "exponent": 0
              },
              {
                "denom": TESTNET_COIN_DENOM,
                "exponent": 6
              }
            ],
            "base": TESTNET_COIN_MIN_DENOM,
            "name": "BeeZee",
            "display": TESTNET_COIN_DENOM,
            "symbol": TESTNET_COIN_DENOM,
            "logo_URIs": {
              "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg",
              "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.png"
            },
            "coingecko_id": "bzedge"
          },
          {
            "description": "BitcoinZ wrapped on BZE network",
            "denom_units": [
              {
                "denom": "factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/bitcoinz",
                "exponent": 0
              },
              {
                "denom": "BTCZ",
                "exponent": 8
              }
            ],
            "base": "factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/bitcoinz",
            "name": "BitcoinZ",
            "display": "BTCZ",
            "symbol": "BTCZ",
            "logo_URIs": {
              "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg",
              "png": "https://getbtcz.com/wp-content/uploads/2020/05/BTCZ-LOGO-fresh.png"
            },
            "coingecko_id": "bitcoinz"
          },
          {
            "description": "A test denomination created by Faneatiku",
            "denom_units": [
              {
                "denom": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku1",
                "exponent": 0,
                "aliases": []
              },
              {
                "denom": "ALPHA",
                "exponent": 6,
                "aliases": []
              }
            ],
            "base": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku1",
            "display": "ALPHA",
            "name": "Alpha",
            "symbol": "ALP"
          },
          {
            "description": "A test denomination created by Faneatiku",
            "denom_units": [
              {
                "denom": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku2",
                "exponent": 0,
                "aliases": []
              },
              {
                "denom": "BETA",
                "exponent": 6,
                "aliases": []
              }
            ],
            "base": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku2",
            "display": "BETA",
            "name": "Beta",
            "symbol": "BETA"
          },
          {
            "description": "Stefan's token",
            "denom_units": [
              {
                "denom": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku3",
                "exponent": 0,
                "aliases": []
              }
            ],
            "base": "factory/testbz1w9vva0muctcrmd9xgret9x4wasw2rrflsdkwfs/faneatiku3",
            "display": "STF",
            "name": "STeF",
            "symbol": "STF"
          },
          {
            "description": "Celestia",
            "denom_units": [
              {
                "denom": "ibc/2537300C916FD9DFBE5995327C56667963FD29A2272A4EC6A90C01D753F4FCFE",
                "exponent": 0,
                "aliases": []
              },
              {
                "denom": "TIA",
                "exponent": 6,
                "aliases": []
              },
            ],
            "base": "ibc/2537300C916FD9DFBE5995327C56667963FD29A2272A4EC6A90C01D753F4FCFE",
            "display": "TIA",
            "name": "Celestia",
            "symbol": "TIA",
            "logo_URIs": {
              "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/celestia/images/celestia.png"
            }
          },
          {
            "description": "Vidulum token",
            "denom_units": [
              {
                "denom": "factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/vidulum",
                "exponent": 0,
                "aliases": []
              },
              {
                "denom": "TVDL",
                "exponent": 6,
                "aliases": []
              },
            ],
            "base": "factory/testbz1z3mkcr2jz424w6m49frgjmy9uhlrx69p4cvrgf/vidulum",
            "display": "TVDL",
            "name": "Vidulum",
            "symbol": "TVDL",
            "logo_URIs": {
              "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/vidulum/images/vdl.png"
            },
          },
        ]   
      }
    ]
  }
}

export const CHAINS = [
  ...chains,
  BZE_TESTNET_2_SUGGEST_CHAIN,
];

export const ASSETS = [
  ...assets,
  ...networks.testnet.assets,
];

export function getNetwork(chainId: string) {
  if (chainId === 'bzetestnet-2') {
    return networks.testnet;
  }

  return networks.mainnet;
}
