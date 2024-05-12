import { Divider, Box, Text } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { SearchInput } from "@/components/common/Input";
import AssetList from "@/components/common/AssetList";

function TokenList() {

  const handleSearch = (query: string) => {
    if (query.length === 0) {
      return;
    }
    
    console.log('search handler:', query);
  }

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
      <AssetList
        needChainSpace={true}
        isOtherChains={false}
        titles={['Asset', 'Verified']}
        list={[
          {
            isOtherChains: true,
            needChainSpace: false,
            imgSrc:'https://raw.githubusercontent.com/cosmos/chain-registry/master/beezee/images/bze.png',
            symbol: 'BZE',
            name: 'BeeZee',
            tokenAmount: '✅ YES',
            tokenAmountPrice: 'Verified by BZE',
            onWithdraw: () => {
              console.log('onWithdraw');
            },
            showWithdraw: true,
            withdrawLabel: "Details",
          },
        ]}
      />
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
