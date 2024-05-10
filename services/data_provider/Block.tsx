import { GetBlockByHeightResponseSDKType } from "@bze/bzejs/types/codegen/cosmos/base/tendermint/v1beta1/query";
import { getRestClient } from "../Client";
import Long from "long";

type FailoverBlockTimes = {
  [key: string]: string;
};

const FAILOVER_BLOCKTIMES: FailoverBlockTimes = {
  "9334084": "2023-12-07T14:30:55.034845214Z",
  "4423602": "2023-01-18T07:51:31.391193017Z",
  "4827583": "2023-02-14T03:34:27.791387761Z",
  "5149043": "2023-03-07T11:41:10.455072975Z",
  "10855457": "2024-03-17T19:41:34.031980836Z",
};

const BLOCK_KEY = 'tendermint:block:';

export async function getBlockDetailsByHeight(height: Long): Promise<GetBlockByHeightResponseSDKType> {
  try {
    const cacheKey = BLOCK_KEY + height;
    let localData = localStorage.getItem(cacheKey);
    if (null !== localData) {
        let parsed = JSON.parse(localData);
        if (parsed) {
          return new Promise<GetBlockByHeightResponseSDKType> ((resolve) => {
            resolve({...parsed.params});
          })
        }
    }

    const client = await getRestClient();
    let response = await client.cosmos.base.tendermint.v1beta1.getBlockByHeight({height: height});
    let cacheData = {
        params: {...response},
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));

    return new Promise<GetBlockByHeightResponseSDKType> ((resolve) => {
        resolve(response);
    })
  } catch(e) {
    console.error(e);
    return {};
  }
}

export async function getBlockTimeByHeight(height: Long): Promise<Date|undefined> {
  const details = await getBlockDetailsByHeight(height);
  if (details.block_id === undefined) {
    if (height.toString() in FAILOVER_BLOCKTIMES) {
      return new Date(FAILOVER_BLOCKTIMES[height.toString()]);
    }
  }

  return details.block?.header?.time
}
