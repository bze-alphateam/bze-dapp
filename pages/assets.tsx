import { Divider, Box, Text } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { SearchInput } from "@/components/common/Input";
import AssetList from "@/components/common/AssetList";
import { useEffect, useState } from "react";
import { Token, getAllSupplyTokens, isNativeType, sortAssets } from "@/services";
import { useRouter } from "next/router";
import { useChain } from "@cosmos-kit/react";
import { getChainName } from "@/utils";
import { CoinSDKType } from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";
import { getAddressBalances, removeBalancesCache } from "@/services/data_provider/Balances";
import AddressBalanceListener from "@/services/listener/BalanceListener";

function TokenList() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Map<string, Token>>(new Map());
  const [userBalances, setUserBalances] = useState<CoinSDKType[]>([]);
  const [filtered, setFiltered] = useState<Token[]>([]);

  const router = useRouter();
  const { address } = useChain(getChainName());

  const handleSearch = (query: string) => {
    setLoading(true);
    if (query.length === 0) {
      setFiltered(sortAssets(Array.from(list.values())));
      setLoading(false);
      return;
    }
    
    let res: Token[] = [];
    query = query.toLowerCase();
    list.forEach((token, index) => {
      if (index.toLowerCase().includes(query)) {
        res.push(token);
        return;
      }

      if (token.metadata.display.toLowerCase().includes(query) || token.metadata.name.toLowerCase().includes(query) || token.metadata.symbol.toLowerCase().includes(query)) {
        res.push(token);
      }
    });

    setFiltered(sortAssets(res));
    setLoading(false);
  }

  const fetchBalances = async () => {
    if (address !== undefined) {
      const balances = await getAddressBalances(address);
      if (balances.balances.length > 0) {
        setUserBalances(balances.balances);
      }
    } else {
      setUserBalances([]);
    }
  }

  const fetchList = async () => {
    const tokens = await getAllSupplyTokens();

    setList(tokens);
    setFiltered(sortAssets(Array.from(tokens.values())));
    await fetchBalances();
    setLoading(false);
  }

  useEffect(() => {
    fetchList();
    if (address !== undefined) {
      fetchBalances();
      AddressBalanceListener.clearCallbacks();
      AddressBalanceListener.setAddress(address);
      AddressBalanceListener.addOnSendAndReceiveCallback(async () => {
        await removeBalancesCache(address);
        fetchBalances();
      });
      AddressBalanceListener.start();
    } else {
      AddressBalanceListener.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return (
    <DefaultBorderedBox 
      ml='$6' 
      mr={{desktop: '$0', mobile: '$6'}}
      mb='$6'
      flexDirection='column' 
      width='$auto'
      >
       <Box
        display='flex'
        flex={1}
        justifyContent={{desktop: 'space-between', mobile: 'center'}}
        flexDirection={{desktop: 'row', mobile: 'column'}}
        p='$2'
        m='$4'
        gap={'$2'}
       >
          <Box mt='$6'>
            <Text fontSize={'$md'}>All Assets</Text>    
          </Box>
          <SearchInput placeholder='Search asset' width={20} onSubmit={handleSearch}/>
        </Box>
      <Divider mb='$2'/>
      <Box display='flex' flexDirection={'column'} p='$2' m='$4'> 
      {loading ? 
        <AssetList
          list={[]}
          /> :
        <AssetList
          balances={userBalances}
          list={
            filtered.map((token, i) => {
              return {
                token: token,
                onWithdraw: () => {
                  router.push({
                    pathname: '/token',
                    query: {
                      denom: token.metadata.base
                    }
                  });
                },
                showWithdraw: token.type.toLowerCase() === 'factory',
                withdrawLabel: "Details",
              };
            })
          }
        />
      }
      </Box>
    </DefaultBorderedBox>
  );
}

export default function Assets() {
  return (
    <Layout>
      <Box display='block' flexDirection={'row'}>
        <Box marginBottom={'$12'} ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>BZE Blockchain Assets</Text>
        </Box>
      </Box >
      <Box display='flex' flexDirection='column'>
        <TokenList />
      </Box>
    </Layout>
  );
}
