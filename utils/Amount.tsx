
import { parseCoins } from "@cosmjs/stargate";
import BigNumber from 'bignumber.js';

export function uAmountToAmount(amount: string | number, noOfDecimals: number): string {
  return new BigNumber(amount)
    .shiftedBy((-1)*noOfDecimals)
    .decimalPlaces(noOfDecimals || 6)
    .toString();
  // let parsed = parseInt(amount);
  
  // return parsed / Math.pow(10, noOfDecimals);
} 

export function amountToUAmount(amount: string | number, noOfDecimals: number): string {
  return new BigNumber(amount)
    .shiftedBy(noOfDecimals)
    .decimalPlaces(noOfDecimals || 6)
    .toString();

  // let parsed = parseFloat(amount);
  
  // return parsed * Math.pow(10, noOfDecimals);
} 

export function prettyAmount(amount: number | string): string {
  return Intl.NumberFormat('en', { notation: 'standard' }).format(new BigNumber(amount).toNumber());
}

export function prettyFee(fee: string): string {
  let parsed = parseCoins(fee);
  if (parsed.length === 0) {
    return 'Not found';
  } else {
    let coin = parsed[0];
    let prettyCoin = prettyAmount(uAmountToAmount(coin.amount, 6));
    return `${prettyCoin} BZE`;
  }
}

export const shiftDigits = (
  num: string | number,
  places: number,
  decimalPlaces?: number
) => {
  return new BigNumber(num)
    .shiftedBy(places)
    .decimalPlaces(decimalPlaces || 6)
    .toString();
}

export const isGreaterThanZero = (val: number | string | undefined) => {
  return new BigNumber(val || 0).gt(0);
};

export const isGreaterOrEqualToZero = (val: number | string | undefined) => {
  return new BigNumber(val || 0).gte(0);
};

export const isGreaterOrEqualThan = (val: number | string | undefined, compare: number | string | undefined) => {
  return new BigNumber(val || 0).gte(compare || 0);
};

export const calculateTotalAmount = (price: string, amount: string, decimals: number): string => {
  const priceNum = new BigNumber(price);
  const amountNum = new BigNumber(amount);
  const total = priceNum.multipliedBy(amountNum);

  return total.decimalPlaces(decimals).toString();
}

export const calculatePricePerUnit = (amount: string, totalPrice: string, decimals: number): string => {
  const amountNum = new BigNumber(amount);
  const total = new BigNumber(totalPrice);

  return total.dividedBy(amountNum).decimalPlaces(decimals).toString();
}

export const calculateAmountFromPrice = (price: string, totalPrice: string, decimals: number): string => {
  const total = new BigNumber(totalPrice);
  const priceNum = new BigNumber(price);

  return total.div(priceNum).decimalPlaces(decimals).toString();
}

export const priceToUPrice = (price: BigNumber, quoteExponent: number, baseExponent: number): string => {
  return price.multipliedBy(Math.pow(10, (quoteExponent - baseExponent))).toFixed(12).toString()
}

export const uPriceToPrice = (price: BigNumber, quoteExponent: number, baseExponent: number): string => {
  return price.multipliedBy(Math.pow(10, (baseExponent - quoteExponent))).toFixed(12).toString()
}
