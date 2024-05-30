import { assets } from 'chain-registry';
import { useQuery } from '@tanstack/react-query';
import { AssetList } from '@chain-registry/types';
import { Token } from '@/services';

type CoinGeckoId = string;
type CoinGeckoUSD = { usd: number };
type CoinGeckoUSDResponse = Record<CoinGeckoId, CoinGeckoUSD>;
export type Prices = Record<CoinGeckoId, CoinGeckoUSD['usd']>;

const handleError = (resp: Response) => {
  if (!resp.ok) throw Error(resp.statusText);
  return resp;
};

const getGeckoIdsFromTokens = (tokens: Token[]) => {
  return tokens
    .filter((asset) => asset.coingekoId !== undefined)
    .map((asset) => asset.coingekoId)
    .filter(Boolean) as string[];
};

const formatPrices = (
  prices: CoinGeckoUSDResponse,
  tokens: Token[]
): Prices => {
  return Object.entries(prices).reduce((priceHash, cur) => {
    const token = tokens.find(
      (token) => token.coingekoId === cur[0]
    )!;
    const denom = token.metadata.base;
    return { ...priceHash, [denom]: cur[1].usd };
  }, {});
};

const fetchPrices = async (
  geckoIds: string[]
): Promise<CoinGeckoUSDResponse> => {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds.join()}&vs_currencies=usd`;

  return fetch(url)
    .then(handleError)
    .then((res) => res.json());
};

export const useCoinGeckoPrices = (tokens: Token[]) => {
  const geckoIds = getGeckoIdsFromTokens(tokens);

  return useQuery({
    queryKey: ['prices'],
    queryFn: () => fetchPrices(geckoIds),
    select: (data) => formatPrices(data, tokens),
    staleTime: 300 * 1000,
  });
};
