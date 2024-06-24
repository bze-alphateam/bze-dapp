import { QueryMarketHistoryResponseSDKType} from "@bze/bzejs/types/codegen/beezee/tradebin/query";
import { getRestClient } from "../Client";
import { bze } from '@bze/bzejs';
import BigNumber from "bignumber.js";
import { uPriceToPrice } from "@/utils";

interface TimeInterval {
  start: number;
  end: number;
}

export interface ChartPoint extends TimeInterval {
  price: string;
  volume: string;
}

//chart periods
export const CHART_1H = '1H';
export const CHART_1D = '1D';
export const CHART_7D = '7D';
export const CHART_30D = '30D';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const ONE_DAY_MS = 60 * 60 * 24 * 1000;

const { fromPartial: QueryMarketHistoryRequestFromPartial } = bze.tradebin.v1.QueryMarketHistoryRequest;

async function getMarketChartHistory(marketId: string, countTotal: boolean, limit: number, offset: number): Promise<QueryMarketHistoryResponseSDKType> {
  try {
    const client = await getRestClient();
    
    return client.bze.tradebin.v1.marketHistory(QueryMarketHistoryRequestFromPartial({market: marketId, pagination: {limit: limit, offset: offset, reverse: true, countTotal: countTotal}}));
  } catch(e) {
    console.error(e);

    return {list: []};
  }
}

// getNoOfIntervalsNeeded - returns the number of intervals needed to build a chart for 1H, 1D, etc
function getNoOfIntervalsNeeded(chart: string) {
  switch (chart) {
    case CHART_1H: return 60 / 5;
    case CHART_1D: return (60 / 5) * 24;
    case CHART_7D: return (24 / 2) * 7;
    case CHART_30D: return 30;
    default: return 60 / 5;
  }
}

// day needs to be divided in 2 hours intervals.
// if the current hour is 14:33 -> it returns an interval from 14 to 16
// if current hours is 09;59 -> it returns an interval from 8 to 10
function getCurrentDayInterval(): TimeInterval {
  const now = new Date();
  const recent = new Date(now.setUTCHours(0, 0, 0, 0));

  return {
    start: recent.getTime(),
    end: recent.getTime() + ONE_DAY_MS,
  };
}

// day needs to be divided in 2 hours intervals.
// if the current hour is 14:33 -> it returns an interval from 14 to 16
// if current hours is 09;59 -> it returns an interval from 8 to 10
function getCurrentTwoHoursInterval(): TimeInterval {
  const now = new Date();
  const currentHour = now.getUTCHours(); 
  const recent = new Date(now.setUTCHours(currentHour - (currentHour  % 2), 0, 0, 0));

  return {
    start: recent.getTime(),
    end: recent.getTime() + TWO_HOURS_MS,
  };
}

// hour needs to be divided in 5 minutes interval
// if current hour is 10:33 -> it returns an interval from 10:30 to 10:35
function getCurrentFiveMinutesInterval(): TimeInterval {
  const now = new Date();
  const currentMinute = now.getUTCMinutes();

  // Determine the most recent 5-minute interval
  const mostRecentFiveMinutes = currentMinute - (currentMinute % 5);
  const recent = new Date(now.setUTCMinutes(mostRecentFiveMinutes, 0, 0));

  //add 5 minutes to get the next timestamp in the future
  return {
    start: recent.getTime(),
    end: recent.getTime() + FIVE_MINUTES_MS,
  };
}

//returns current interval for the needed chart
function getChartCurrentInterval(chart: string): TimeInterval {
  if (chart === CHART_1D || chart === CHART_1H) {
    return getCurrentFiveMinutesInterval();
  }

  if (chart === CHART_7D) {
    return getCurrentTwoHoursInterval();
  }

  return getCurrentDayInterval();
}

function decrementTimeInterval(interval: TimeInterval): TimeInterval {
  const diff = interval.end - interval.start;

  return {
    start: interval.start - diff,
    end: interval.end - diff,
  }
}

function buildEmptyIntervals(chart: string): Map<number, ChartPoint> {
  const neededIntervals = getNoOfIntervalsNeeded(chart);
  let currentInterval = getChartCurrentInterval(chart);
  const res = new Map();
  for (let i = 0; i < neededIntervals; i++) {
    res.set(
      currentInterval.end, 
      {
        start: currentInterval.start,
        end: currentInterval.end,
        price: "0",
        volume: "0",
      }
    )

    currentInterval = decrementTimeInterval(currentInterval);
  }

  return res;
}

export async function getMarketChart(marketId: string, chart: string, quoteExponent: number, baseExponent: number): Promise<ChartPoint[]> {
  const limit = 250;
  let offset = 0;
  let marketHistory = await getMarketChartHistory(marketId, false, limit, offset);
  let intervalsToFill = buildEmptyIntervals(chart);
  if (marketHistory.list.length === 0) {
    return Array.from(intervalsToFill.values()).sort((a, b) => a.start - b.start);
  }

  intervalsToFill = await fillChartIntervals(marketHistory, intervalsToFill, limit, offset, marketId, quoteExponent, baseExponent);

  const result = Array.from(intervalsToFill.values()).sort((a, b) => a.start - b.start);

  //fill empty intervals with the next price found
  for (let i = 0; i < result.length; i++) {
    //save first non empty interval
    //an empty interval is one that has price === 0 and volume === 0
    const firstNonEmptyInerval = result[i];
    //iterate until you find the first interval not empty
    if (firstNonEmptyInerval.price === "0" || firstNonEmptyInerval.volume === "0") {
      continue;
    }

    //check next intervals that are empty and need to be filled
    for (let j = i + 1; j < result.length; j++) {
      const nextIterval = result[j];
      if (nextIterval.price !== "0") {
        //stop this for when we find an interval with price
        break;
      }

      //if we reach this it means this interval needs to have a price set
      //we don't touch "volume" because we want to know this interval is filled manually just to make the chart look nicer
      nextIterval.price = firstNonEmptyInerval.price;
      result[j] = nextIterval;
    }
  }

  return result
}

async function fillChartIntervals(
  marketHistory: QueryMarketHistoryResponseSDKType, 
  intervalsToFill: Map<number, ChartPoint>,
  limit: number,
  offset: number,
  marketId: string,
  quoteExponent: number,
  baseExponent: number,
): Promise<Map<number, ChartPoint>> {

  let histBookmark = 0;
  let listLen = marketHistory.list.length;
  for (const [key, interval] of intervalsToFill) {
    if (histBookmark >= listLen) {
      //we reached the end of the history orders and we need to fetch the next page in order to continue populate the remaining intervals
      if (listLen < limit) {
        //if the list is shorter than the limit we asked for it means this is the last page of history and no need to continue
        break;
      }
      //increment offset
      offset += limit;
      //do not ask the blockchain to count total because we already have that number from previous call
      marketHistory = await getMarketChartHistory(marketId, false, limit, offset);
      
      return fillChartIntervals(marketHistory, intervalsToFill, limit, offset, marketId, quoteExponent, baseExponent);
    }

    let totalVolume = new BigNumber(interval.volume);
    let tradedSum = new BigNumber(interval.price).multipliedBy(totalVolume);
    for (let i = histBookmark; i < listLen; i++) {
      const histOrder = marketHistory.list[i];
      const histTime = parseInt(histOrder.executed_at.toString()) * 1000;
      if (histTime < interval.start) {
        break;
      }
      histBookmark = i + 1;

      const amtInt = new BigNumber(histOrder.amount);
      const priceFl = new BigNumber(histOrder.price);
      if (!amtInt || !priceFl) {
        console.error(`error parsing amount [${histOrder.amount}] or price [${histOrder.price}] from history`);
        continue;
      }

      totalVolume = totalVolume.plus(amtInt);
      tradedSum = tradedSum.plus(amtInt.multipliedBy(priceFl));
    }

    if (!totalVolume.eq(0)) {
      interval.price = uPriceToPrice(tradedSum.dividedBy(totalVolume).decimalPlaces(6), quoteExponent, baseExponent);
      interval.volume = totalVolume.toString();
    }
  }

  return intervalsToFill;
}
