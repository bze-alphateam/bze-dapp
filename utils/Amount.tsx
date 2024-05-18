
import { parseCoins } from "@cosmjs/stargate";

export function uAmountToAmount(amount: string, noOfDecimals: number): number {
  let parsed = parseInt(amount);
  
  return parsed / Math.pow(10, noOfDecimals);
} 

export function amountToUAmount(amount: string, noOfDecimals: number): number {
  let parsed = parseFloat(amount);
  
  return parsed * Math.pow(10, noOfDecimals);
} 

export function prettyAmount(amount: number): string {
  return Intl.NumberFormat('en', { notation: 'standard' }).format(amount);
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
