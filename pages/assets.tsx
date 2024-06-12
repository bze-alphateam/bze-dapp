import { Divider, Box, Text } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { SearchInput } from "@/components/common/Input";
import AssetList from "@/components/common/AssetList";
import { useEffect, useState } from "react";
import { Token, getAllSupplyTokens } from "@/services";
import { useRouter } from "next/router";

function TokenList() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Map<string, Token>>(new Map());
  const [filtered, setFiltered] = useState<Token[]>([]);

  const router = useRouter();

  const handleSearch = (query: string) => {
    setLoading(true);
    if (query.length === 0) {
      setFiltered(Array.from(list.values()));
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

    setFiltered(res);
    setLoading(false);
  }

  const fetchList = async () => {
    const tokens = await getAllSupplyTokens();

    setList(tokens);
    setFiltered(Array.from(tokens.values()));
    setLoading(false);
  }

  useEffect(() => {
    fetchList();
  }, []);

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
        justifyContent={'space-between'}
        flexDirection={'row'}
        p='$2'
        m='$4'
       >
        <Box mt='$6'>
          <Text fontSize={'$md'}>All Assets</Text>    
        </Box>
        <SearchInput placeholder='Search token' width={20} onSubmit={handleSearch}/>
      </Box>
      <Divider mb='$2'/>
      <Box display='flex' flexDirection={'column'} p='$2' m='$4'> 
      {loading ? 
        <AssetList
          needChainSpace={true}
          isOtherChains={false}
          titles={['Asset', 'Verified']}
          list={[]}
          /> :
        <AssetList
          needChainSpace={true}
          isOtherChains={false}
          titles={['Asset', 'Type']}
          list={
            filtered.map((token, i) => {
              return {
                isOtherChains: true,
                needChainSpace: false,
                imgSrc: token.logo,
                symbol: token.metadata.symbol,
                name:  token.metadata.name,
                tokenAmount: token.verified ? '✅ Verified' : '❌ Not Verified',
                tokenAmountPrice: `${token.type} Token`,
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
                // showDeposit: true,
                // depositLabel: 'Other'
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
