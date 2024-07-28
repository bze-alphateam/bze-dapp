import { MAINNET_CHAIN_ID } from "./Network";

export const TESTNET_UDENOM = 'utbz';
export const TESTNET_DENOM = 'TBZE';

export const MAINNET_UDENOM = 'ubze';
export const MAINNET_DENOM = 'BZE';

const DEFAULT_EXPONENT = 6;

export function toPrettyDenom(udenom: string): string {
  if (udenom === TESTNET_UDENOM) {
    return TESTNET_DENOM;
  }

  if (udenom === MAINNET_UDENOM) {
    return MAINNET_DENOM;
  }

  //TODO: take denom from chain registry
  return '??';
}

export function getCurrentuDenom(): string {
  if (process.env.NEXT_PUBLIC_CHAIN_ID === MAINNET_CHAIN_ID) {
      return MAINNET_UDENOM;
  }

  return TESTNET_UDENOM;
}

export function getBzeDenomExponent(): number {
  return DEFAULT_EXPONENT;
}
