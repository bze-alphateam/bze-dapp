import { Divider, Box, Text } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { SearchInput } from "@/components/common/Input";
import AssetList from "@/components/common/AssetList";
import { useEffect, useState } from "react";
import { Token, getAllTokens } from "@/services";

function TokenList() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Map<string, Token>>(new Map());
  const [filtered, setFiltered] = useState<Token[]>([]);

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
    const tokens = await getAllTokens();
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
      flexDirection='column' 
      width={'55vw'}
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
          <Text fontSize={'$md'}>Tokens List</Text>    
        </Box>
        <SearchInput placeholder='Search token' width={20} onSubmit={handleSearch}/>
      </Box>
      <Divider mb='$2'/>
      <Box display='flex' flexDirection={'column'} p='$2' m='$4'> 
      {loading ? <Text textAlign={'center'}>Loading list...</Text> :
        <AssetList
          needChainSpace={true}
          isOtherChains={false}
          titles={['Asset', 'Verified']}
          list={
            filtered.map((token, i) => {
              return {
                isOtherChains: true,
                needChainSpace: false,
                imgSrc: token.logo,
                symbol: token.metadata.symbol,
                name:  token.metadata.name,
                tokenAmount: token.verified ? '✅ YES' : '❌ NO',
                tokenAmountPrice: token.verified ? 'Verified by BZE' : '❗ Proceed with caution',
                onWithdraw: () => {
                  console.log('onWithdraw');
                },
                showWithdraw: true,
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

export default function Factory() {
  return (
    <Layout>
      <Box display='block' flexDirection={'row'}>
        <Box marginBottom={'$12'} ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>Token Factory</Text>
        </Box>
      </Box >
      <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column-reverse'}}>
        <TokenList />
      </Box>
    </Layout>
  );
}
