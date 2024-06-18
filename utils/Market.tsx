

export function marketIdFromDenoms(base: string, quote: string): string {
  return `${base}/${quote}`;
}
