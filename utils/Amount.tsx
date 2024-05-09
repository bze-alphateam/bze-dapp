
export function uAmountToAmount(amount: string, noOfDecimals: number): number {
  let parsed = parseInt(amount);
  
  return parsed / Math.pow(10, noOfDecimals);
} 

export function prettyAmount(amount: number): string {
  return Intl.NumberFormat('en', { notation: 'standard' }).format(amount);
}
