
const TESTNET_CHAIN_ID = 'bzetestnet-2';
const TESTNET_COIN_DENOM = "TBZE";
const TESTNET_COIN_MIN_DENOM = "utbz";
const BZE_PREFIX_TESTNET = "testbz";

const BZE_TESTNET_2_SUGGEST_CHAIN = {
  chain_id: TESTNET_CHAIN_ID,
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
    chain: [
      {
        "$schema": "../chain.schema.json",
        "chain_name": "beezee",
        "status": "live",
        "network_type": "mainnet",
        "pretty_name": "BeeZee",
        "chain_id": "beezee-1",
        "bech32_prefix": "bze",
        "daemon_name": "bzed",
        "node_home": "$HOME/.bze",
        "key_algos": [
          "secp256k1"
        ],
        "slip44": 118,
        "fees": {
          "fee_tokens": [
            {
              "denom": "ubze",
              "fixed_min_gas_price": 0.01,
              "low_gas_price": 0.01,
              "average_gas_price": 0.025,
              "high_gas_price": 0.04
            }
          ]
        },
        "staking": {
          "staking_tokens": [
            {
              "denom": "ubze"
            }
          ]
        },
        "codebase": {
          "git_repo": "https://github.com/bze-alphateam/bze",
          "recommended_version": "v7.0.0",
          "compatible_versions": [
            "v7.0.0"
          ],
          "binaries": {
            "darwin/amd64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-darwin-amd64.tar.gz",
            "darwin/arm64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-darwin-arm64.tar.gz",
            "linux/amd64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-linux-amd64.tar.gz",
            "linux/arm64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-linux-arm64.tar.gz",
            "windows/amd64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-win64.zip"
          },
          "genesis": {
            "genesis_url": "https://raw.githubusercontent.com/bze-alphateam/bze/main/genesis.json"
          },
          "versions": [
            {
              "name": "v5.0.1",
              "recommended_version": "v5.0.1",
              "tag": "v5.0.1",
              "compatible_versions": [
                "v5.0.1"
              ],
              "cosmos_sdk_version": "v0.44.3",
              "ibc_go_version": "v1.2.2",
              "consensus": {
                "type": "tendermint",
                "version": "v0.34.14"
              },
              "height": 0,
              "binaries": {
                "darwin/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.0.1/bze-5.0.1-darwin-amd64.tar.gz",
                "darwin/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.0.1/bze-5.0.1-darwin-arm64.tar.gz",
                "linux/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.0.1/bze-5.0.1-linux-amd64.tar.gz",
                "linux/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.0.1/bze-5.0.1-linux-arm64.tar.gz",
                "windows/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.0.1/bze-5.0.1-win64.zip"
              },
              "next_version_name": "v5.1.1"
            },
            {
              "name": "v5.1.1",
              "recommended_version": "v5.1.1",
              "tag": "v5.1.1",
              "compatible_versions": [
                "v5.1.1"
              ],
              "cosmos_sdk_version": "v0.45.9",
              "ibc_go_version": "v1.2.2",
              "consensus": {
                "type": "tendermint",
                "version": "v0.34.22"
              },
              "height": 3303144,
              "binaries": {
                "darwin/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.1/bze-5.1.1-darwin-amd64.tar.gz",
                "darwin/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.1/bze-5.1.1-darwin-arm64.tar.gz",
                "linux/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.1/bze-5.1.1-linux-amd64.tar.gz",
                "linux/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.1/bze-5.1.1-linux-arm64.tar.gz",
                "windows/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.1/bze-5.1.1-win64.zip"
              },
              "next_version_name": "v5.1.2"
            },
            {
              "name": "v5.1.2",
              "recommended_version": "v5.1.2",
              "tag": "v5.1.2",
              "compatible_versions": [
                "v5.1.2"
              ],
              "cosmos_sdk_version": "v0.45.9",
              "ibc_go_version": "v1.2.2",
              "consensus": {
                "type": "tendermint",
                "version": "v0.34.22"
              },
              "height": 3646700,
              "binaries": {
                "darwin/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-darwin-amd64.tar.gz",
                "darwin/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-darwin-arm64.tar.gz",
                "linux/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-linux-amd64.tar.gz",
                "linux/arm64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-linux-arm64.tar.gz",
                "windows/amd64": "https://github.com/bze-alphateam/bze/releases/download/v5.1.2/bze-5.1.2-win64.zip"
              },
              "next_version_name": "v6.0.0"
            },
            {
              "name": "v6.0.0",
              "recommended_version": "v6.0.0",
              "tag": "v6.0.0",
              "compatible_versions": [
                "v6.0.0"
              ],
              "cosmos_sdk_version": "v0.45.10",
              "ibc_go_version": "v2.4.2",
              "consensus": {
                "type": "tendermint",
                "version": "v0.34.22"
              },
              "height": 4875460,
              "binaries": {
                "darwin/amd64": "https://github.com/bze-alphateam/bze/releases/download/v6.0.0/bze-6.0.0-darwin-amd64.tar.gz",
                "darwin/arm64": "https://github.com/bze-alphateam/bze/releases/download/v6.0.0/bze-6.0.0-darwin-arm64.tar.gz",
                "linux/amd64": "https://github.com/bze-alphateam/bze/releases/download/v6.0.0/bze-6.0.0-linux-amd64.tar.gz",
                "linux/arm64": "https://github.com/bze-alphateam/bze/releases/download/v6.0.0/bze-6.0.0-linux-arm64.tar.gz",
                "windows/amd64": "https://github.com/bze-alphateam/bze/releases/download/v6.0.0/bze-6.0.0-win64.zip"
              },
              "next_version_name": "v6.1.0"
            },
            {
              "name": "v6.1.0",
              "recommended_version": "v6.1.0",
              "tag": "v6.1.0",
              "compatible_versions": [
                "v6.1.0"
              ],
              "cosmos_sdk_version": "v0.45.16",
              "ibc_go_version": "v4.5.1",
              "consensus": {
                "type": "cometbft",
                "version": "v0.34.27"
              },
              "height": 9079079,
              "binaries": {
                "darwin/amd64": "https://github.com/bze-alphateam/bze/releases/download/v6.1.0/bze-6.1.0-darwin-amd64.tar.gz",
                "darwin/arm64": "https://github.com/bze-alphateam/bze/releases/download/v6.1.0/bze-6.1.0-darwin-arm64.tar.gz",
                "linux/amd64": "https://github.com/bze-alphateam/bze/releases/download/v6.1.0/bze-6.1.0-linux-amd64.tar.gz",
                "linux/arm64": "https://github.com/bze-alphateam/bze/releases/download/v6.1.0/bze-6.1.0-linux-arm64.tar.gz",
                "windows/amd64": "https://github.com/bze-alphateam/bze/releases/download/v6.1.0/bze-6.1.0-win64.zip"
              },
              "next_version_name": "v7.0.0"
            },
            {
              "name": "v7.0.0",
              "recommended_version": "v7.0.0",
              "tag": "v7.0.0",
              "compatible_versions": [
                "v7.0.0"
              ],
              "cosmos_sdk_version": "v0.45.16",
              "ibc_go_version": "v4.5.1",
              "consensus": {
                "type": "cometbft",
                "version": "v0.34.27"
              },
              "height": 12723000,
              "binaries": {
                "darwin/amd64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-darwin-amd64.tar.gz",
                "darwin/arm64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-darwin-arm64.tar.gz",
                "linux/amd64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-linux-amd64.tar.gz",
                "linux/arm64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-linux-arm64.tar.gz",
                "windows/amd64": "https://github.com/bze-alphateam/bze/releases/download/v7.0.0/bze-7.0.0-win64.zip"
              },
              "next_version_name": "v7.1.0"
            }
          ]
        },
        "logo_URIs": {
          "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.png",
          "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg"
        },
        "peers": {
          "seeds": [
            {
              "id": "6385d5fb198e3a793498019bb8917973325e5eb7",
              "address": "51.15.138.216:26656",
              "provider": "AlphaTeam"
            },
            {
              "id": "8542cd7e6bf9d260fef543bc49e59be5a3fa9074",
              "address": "seed.publicnode.com:26656",
              "provider": "Allnodes ⚡️ Nodes & Staking"
            }
          ],
          "persistent_peers": [
            {
              "id": "ef5377944874e2e8e5bd7156d2bb2e46c6a24b45",
              "address": "31.220.82.236:26656",
              "provider": "AlphaTeam"
            }
          ]
        },
        "apis": {
          "rpc": [
            {
              "address": "https://rpc.getbze.com",
              "provider": "AlphaTeam"
            },
            {
              "address": "https://rpc-1.getbze.com",
              "provider": "AlphaTeam"
            },
            {
              "address": "https://rpc-2.getbze.com",
              "provider": "AlphaTeam"
            },
            {
              "address": "https://beezee_mainnet_rpc.chain.whenmoonwhenlambo.money",
              "provider": "🚀 WHEN MOON 🌕 WHEN LAMBO 🔥"
            }
          ],
          "rest": [
            {
              "address": "https://rest.getbze.com",
              "provider": "AlphaTeam"
            },
            {
              "address": "https://rest-1.getbze.com",
              "provider": "AlphaTeam"
            },
            {
              "address": "https://rest-2.getbze.com",
              "provider": "AlphaTeam"
            },
            {
              "address": "https://beezee_mainnet_api.chain.whenmoonwhenlambo.money",
              "provider": "🚀 WHEN MOON 🌕 WHEN LAMBO 🔥"
            }
          ],
          "grpc": [
            {
              "address": "grpc.getbze.com:9099",
              "provider": "AlphaTeam"
            },
            {
              "address": "grpc-1.getbze.com:9099",
              "provider": "AlphaTeam"
            },
            {
              "address": "grpc-2.getbze.com:9099",
              "provider": "AlphaTeam"
            }
          ]
        },
        "explorers": [
          {
            "kind": "ping.pub",
            "url": "https://ping.pub/beezee",
            "tx_page": "https://ping.pub/beezee/tx/${txHash}",
            "account_page": "https://ping.pub/beezee/account/${accountAddress}"
          },
          {
            "kind": "ping.pub",
            "url": "https://explorer.getbze.com/beezee",
            "tx_page": "https://explorer.getbze.com/beezee/tx/${txHash}",
            "account_page": "https://explorer.getbze.com/beezee/account/${accountAddress}"
          },
          {
            "kind": "atomscan",
            "url": "https://atomscan.com/beezee",
            "tx_page": "https://atomscan.com/beezee/transactions/${txHash}",
            "account_page": "https://atomscan.com/beezee/accounts/${accountAddress}"
          },
          {
            "kind": "🚀 WHEN MOON 🌕 WHEN LAMBO 🔥",
            "url": "https://explorer.whenmoonwhenlambo.money/beezee",
            "tx_page": "https://explorer.whenmoonwhenlambo.money/beezee/tx/${txHash}",
            "account_page": "https://explorer.whenmoonwhenlambo.money/beezee/account/${accountAddress}"
          }
        ],
        "images": [
          {
            "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.png",
            "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg",
            "theme": {
              "primary_color_hex": "#079fd7"
            }
          }
        ]
      }
    ],
    assets: [
      {
        "$schema": "../assetlist.schema.json",
        "chain_name": "beezee",
        "assets": [
          {
            "description": "BeeZee native blockchain",
            "denom_units": [
              {
                "denom": "ubze",
                "exponent": 0
              },
              {
                "denom": "bze",
                "exponent": 6
              }
            ],
            "base": "ubze",
            "name": "BeeZee",
            "display": "bze",
            "symbol": "BZE",
            "logo_URIs": {
              "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.png",
              "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg"
            },
            "coingecko_id": "bzedge",
            "images": [
              {
                "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.png",
                "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.svg",
                "theme": {
                  "primary_color_hex": "#079fd7"
                }
              }
            ]
          },
          {
            "description": "Vidulum App Token",
            "denom_units": [
              {
                "denom": "factory/bze13gzq40che93tgfm9kzmkpjamah5nj0j73pyhqk/uvdl",
                "exponent": 0
              },
              {
                "denom": "vdl",
                "exponent": 6
              }
            ],
            "base": "factory/bze13gzq40che93tgfm9kzmkpjamah5nj0j73pyhqk/uvdl",
            "name": "Vidulum",
            "display": "vdl",
            "symbol": "VDL",
            "logo_URIs": {
              "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/vdl.png",
              "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/vdl.svg"
            },
            "coingecko_id": "vidulum",
            "images": [
              {
                "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/vdl.png",
                "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/vdl.svg",
                "theme": {
                  "primary_color_hex": "#3454bc"
                }
              }
            ]
          },
          {
            "description": "OSMO from Osmosis",
            "denom_units": [
              {
                "denom": "ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518",
                "exponent": 0,
                "aliases": [
                  "uosmo"
                ]
              },
              {
                "denom": "osmo",
                "exponent": 6,
                "aliases": []
              }
            ],
            "type_asset": "ics20",
            "base": "ibc/ED07A3391A112B175915CD8FAF43A2DA8E4790EDE12566649D0C2F97716B8518",
            "name": "Osmosis",
            "display": "osmo",
            "symbol": "OSMO",
            "traces": [
              {
                "type": "ibc",
                "counterparty": {
                  "chain_name": "osmosis",
                  "base_denom": "uosmo",
                  "channel_id": "channel-340"
                },
                "chain": {
                  "channel_id": "channel-0",
                  "path": "transfer/channel-0/uosmo"
                }
              }
            ],
            "images": [
              {
                "image_sync": {
                  "chain_name": "osmosis",
                  "base_denom": "uosmo"
                },
                "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png",
                "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.svg",
                "theme": {
                  "primary_color_hex": "#760dbb"
                }
              }
            ],
            "logo_URIs": {
              "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png",
              "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.svg"
            }
          },
          {
            "description": "Crypto2Mars Community Token",
            "denom_units": [
              {
                "denom": "factory/bze15pqjgk4la0mfphwddce00d05n3th3u66n3ptcv/2MARS",
                "exponent": 0
              },
              {
                "denom": "C2M",
                "exponent": 6
              }
            ],
            "base": "factory/bze15pqjgk4la0mfphwddce00d05n3th3u66n3ptcv/2MARS",
            "name": "Crypto2Mars",
            "display": "C2M",
            "symbol": "C2M",
            "logo_URIs": {
              "png": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/beezee/factory/bze15pqjgk4la0mfphwddce00d05n3th3u66n3ptcv/c2m.png"
            },
            "images": [
              {
                "png": "https://raw.githubusercontent.com/chainapsis/keplr-chain-registry/main/images/beezee/factory/bze15pqjgk4la0mfphwddce00d05n3th3u66n3ptcv/c2m.png",
                "theme": {
                  "primary_color_hex": "#FEFEFE"
                }
              }
            ]
          },
          {
            "description": "USDC from Noble",
            "denom_units": [
              {
                "denom": "ibc/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162A1A47DB930D40D8AF4",
                "exponent": 0,
                "aliases": [
                  "uusdc"
                ]
              },
              {
                "denom": "usdc",
                "exponent": 6,
                "aliases": []
              }
            ],
            "type_asset": "ics20",
            "base": "ibc/6490A7EAB61059BFC1CDDEB05917DD70BDF3A611654162A1A47DB930D40D8AF4",
            "name": "USDC",
            "display": "usdc",
            "symbol": "USDC",
            "traces": [
              {
                "type": "ibc",
                "counterparty": {
                  "chain_name": "noble",
                  "base_denom": "uusdc",
                  "channel_id": "channel-95"
                },
                "chain": {
                  "channel_id": "channel-3",
                  "path": "transfer/channel-3/uusdc"
                }
              }
            ],
            "images": [
              {
                "image_sync": {
                  "chain_name": "noble",
                  "base_denom": "uusdc"
                },
                "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/USDCoin.png",
                "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/USDCoin.svg",
                "theme": {
                  "primary_color_hex": "#2474cc"
                }
              }
            ],
            "logo_URIs": {
              "png": "https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/USDCoin.png",
              "svg": "https://raw.githubusercontent.com/cosmos/chain-registry/master/noble/images/USDCoin.svg"
            }
          }
        ]
      }
    ],
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
  ...networks.mainnet.chain,
  BZE_TESTNET_2_SUGGEST_CHAIN,
];

export const ASSETS = [
  ...networks.mainnet.assets,
  ...networks.testnet.assets,
];

export function getNetwork(chainId: string) {
  if (chainId === TESTNET_CHAIN_ID) {
    return networks.testnet;
  }

  return networks.mainnet;
}
