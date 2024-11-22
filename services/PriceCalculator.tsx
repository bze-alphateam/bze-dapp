import BigNumber from "bignumber.js";
import { fetchAssetUsdPrice } from "./data_provider/Price";
import { Token, getTokenDisplayDenom } from "./data_provider/Tokens";
import { uPriceToBigNumberPrice } from "@/utils";

const USD_DISPLAY_DENOM = 'USD';

export interface MarketPrices {
  base: BigNumber;
  quote: BigNumber;
  denom: string;
}

export const getAssetPrice = async (asset: Token): Promise<BigNumber> => {
  if (!asset.coingekoId) {
    return BigNumber(0); 
  }

  const fetchedPrice = await fetchAssetUsdPrice(asset.coingekoId);
  if (!fetchedPrice) {
    return BigNumber(0);
  }

  return BigNumber(fetchedPrice.price);
}

// returns prices for assets in USD if possible or in STABLE coin if at least one token is a stable coin
// CAUTION: call it with lastPrice converted from uPrice to Price
export const getMarketUsdPrices = async (base: Token, quote: Token, lastPrice: BigNumber): Promise<MarketPrices> => {
  if (!lastPrice.gt(0)) {
    return {
      base: new BigNumber(0), 
      quote: new BigNumber(0),
      denom: USD_DISPLAY_DENOM,
    };
  }

  if (quote.stableCoin) {
    return {
      base: lastPrice, 
      quote: new BigNumber(1),
      denom: (await getTokenDisplayDenom(quote.metadata.base, quote)).denom,
    };
  }

  if (base.stableCoin) {
    return {
      base: new BigNumber(1), 
      quote: (new BigNumber(1)).dividedBy(lastPrice),
      denom: (await getTokenDisplayDenom(base.metadata.base, base)).denom,
    };
  }

  const quotePriceUsd = await getAssetPrice(quote);
  if (quotePriceUsd.gt(0)) {
    return {
      base: quotePriceUsd.multipliedBy(lastPrice), 
      quote: quotePriceUsd,
      denom: USD_DISPLAY_DENOM,
    }
  }

  const basePriceUsd = await getAssetPrice(base);
  if (basePriceUsd.gt(0)) {
    return {
      base: basePriceUsd, 
      quote: basePriceUsd.dividedBy(lastPrice),
      denom: USD_DISPLAY_DENOM,
    };
  }

  return {
    base: new BigNumber(0), 
    quote: new BigNumber(0),
    denom: USD_DISPLAY_DENOM,
  };
}

export const formatUsdAmount = (priceNum: BigNumber): string => {
  const price = priceNum.toString();
  // Find the decimal point index
  const decimalIndex = price.indexOf('.');

  if (decimalIndex === -1) {
    // If there's no decimal point, return the number as is
    return price;
  }

  // Split the number into integer and decimal parts
  const integerPart = price.substring(0, decimalIndex);
  let decimalPart = price.substring(decimalIndex + 1);
  let significantDigitCount = 0;
  let decimalsFound = 0;

  // Iterate through each character in the decimal part
  for (let i = 0; i < decimalPart.length; i++) {
    const digit = decimalPart[i];
    decimalsFound++;
    
    if (digit !== '0' || significantDigitCount > 0) {
      significantDigitCount++;
    }

    // Stop if we have collected four significant digits
    if (significantDigitCount >= 6) {
      break;
    }
  }

  // Construct the final number
  return priceNum.toFixed(decimalsFound).toString();
}
