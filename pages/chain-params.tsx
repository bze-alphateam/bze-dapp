import { Divider, Box, Text } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { useEffect, useState } from "react";
import { getRewardsParams, getTokenFactoryParams, getTradebinParams } from "@/services";
import { prettyFee } from "@/utils";

function prettyDestination(dest: string) {
  if (dest === 'community_pool') {

    return 'Community Pool';
  } else if (dest === 'burner') {

    return 'Burner Module';
  }

  return 'Unknown';
}

function ChainParamItem({ children, name, value }: { children: React.ReactNode, name: string, value: string }) {
  return (
      <DefaultBorderedBox mr='$6' mt={{desktop: "$0", mobile: '$6'}}>
        <Box display={'flex'} flexDirection={'column'} alignItems='center'>
          <Box p='$6'>
            <Text fontSize={'$lg'} fontWeight={'$bold'} color='$primary200'>{name}</Text>
          </Box>
          <Box  p='$6' fontWeight={'$bold'}>
            <Text fontSize={'$md'} color='$primary100'>{value}</Text>
          </Box>
        </Box>
        <Divider/>
        <Box m='$6' textAlign='center'>
          {children}
        </Box>
      </DefaultBorderedBox>
  );
}

function ChainModuleParams({ children, title }: { children: React.ReactNode, title: string}) {
  return (
    <Box p='$6'>
      <Box mb='$6'>
        <Text as="h2" fontSize={'$xl'}>{title}</Text>
      </Box>
      <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column'}}>
        {children}
      </Box>
    </Box>
  );
}

function TradebinModuleParams() {
  const [createFee, setCreateFee] = useState<string>('?? BZE');
  const [makerFee, setMakerFee] = useState<string>('?? BZE');
  const [takerFee, setTakerFee] = useState<string>('?? BZE');
  const [makerDest, setMakerDest] = useState<string>('??');
  const [takerDest, setTakerDest] = useState<string>('??');

  const fetchParams = async () => {
    let params = await getTradebinParams();
    if (params.params === undefined) {
      setCreateFee('Unknown');
      setMakerFee('Unknown');
      setTakerFee('Unknown');
      setMakerDest('Unknown');
      setTakerDest('Unknown');

      return;
    }

    setCreateFee(prettyFee(params.params.createMarketFee));
    setMakerFee(prettyFee(params.params.marketMakerFee));
    setTakerFee(prettyFee(params.params.marketTakerFee));
    setMakerDest(prettyDestination(params.params.makerFeeDestination));
    setTakerDest(prettyDestination(params.params.takerFeeDestination));
  }

  useEffect(() => {
    fetchParams();
  }, [])

  return (
    <ChainModuleParams title='DEX - Tradebin module'>
      <ChainParamItem name="Create Market Fee" value={createFee}>
        <Text>The BZE DEX module enables users to create their own market pairs between two denominations. This process is permissionless and incurs a fee, which is determined by the blockchain. Pricing is controlled by the community and can be modified through a governance proposal. Please contact us via Twitter or Discord if you wish to suggest a lower fee or if you require a grant for the fee. The fee is directed to the community pool.</Text>
      </ChainParamItem>
      <ChainParamItem name="Market Maker Fee" value={makerFee}>
        <Text>The market maker fee is a charge imposed on users who provide liquidity by placing limit orders that do not fill immediately. This fee is typically lower than taker fees to incentivize users to add liquidity to the market. The accumulated fees contribute to maintaining the operational integrity and enhancing the liquidity of the DEX, thereby ensuring smoother trading experiences for all participants. Market maker fee can be adjusted via community governance proposal.</Text>
      </ChainParamItem>
      <ChainParamItem name="Market Taker Fee" value={takerFee}>
        <Text>The market taker fee is applied to trades that are executed against existing orders on the order book, effectively taking liquidity from the market. This fee is generally higher than market maker fees to balance the ecosystem by encouraging the provision of liquidity. Taker fees help manage the volume and pace of trading, ensuring that liquidity is available for those needing immediate order execution. Like maker fees, taker fees are set by the blockchain and can be revised through governance proposal.</Text>
      </ChainParamItem>
      <ChainParamItem name="Maker Fee Destination" value={makerDest}>
        <Text>Market fees, as described above, can be directed either to the Burner module for burning or to the community pool. The blockchain permits the redirection of these fees through a governance proposal, allowing stakeholders to decide the most beneficial use of the accumulated funds. This flexibility supports the continuous improvement of the platform and aligns with the community’s interests and priorities.</Text>
      </ChainParamItem>
      <ChainParamItem name="Taker Fee Destination" value={takerDest}>
        <Text>Market fees, as described above, can be directed either to the Burner module for burning or to the community pool. The blockchain permits the redirection of these fees through a governance proposal, allowing stakeholders to decide the most beneficial use of the accumulated funds. This flexibility supports the continuous improvement of the platform and aligns with the community’s interests and priorities.</Text>
      </ChainParamItem>
    </ChainModuleParams>
  );
}

function TokenFactoryModuleParams() {
  const [fee, setFee] = useState<string>('?? BZE');

  const fetchParams = async () => {
    let params = await getTokenFactoryParams();
    if (params.params === undefined) {
      setFee('Unknown');

      return;
    }

    setFee(prettyFee(params.params.createDenomFee));
  }

  useEffect(() => {
    fetchParams();
  }, []);

  return (
    <ChainModuleParams title='Token Factory'>
      <ChainParamItem name='Create Denomination Fee' value={fee}>
        <Text>The Token Factory module on the BZE blockchain allows users to create their own denominations. These denominations function like any other coin on the blockchain, with capabilities for sending and using them both within and across other blockchains via Inter-Blockchain Communication (IBC). The fee associated with creating a token acts as a deterrent against network spam and is directed to the community pool.</Text>
      </ChainParamItem>
    </ChainModuleParams>
  );
}

function RewardsModuleParams() {
  const [sFee, setSFee] = useState<string>('?? BZE');
  const [rFee, setRFee] = useState<string>('?? BZE');

  const fetchParams = async () => {
    let params = await getRewardsParams();
    if (params.params === undefined) {
      setSFee('Unknown');

      return;
    }

    setSFee(prettyFee(params.params.createStakingRewardFee));
    setRFee(prettyFee(params.params.createTradingRewardFee));
  }

  useEffect(() => {
    fetchParams();
  }, []);

  return (
    <ChainModuleParams title='Earn - Rewards module'>
      <ChainParamItem name='Create Staking Reward Fee' value={sFee}>
        <Text>The Rewards module offers users the option to create staking reward programs for specific denominations of their choice. Setting up these programs necessitates the payment of a fee and the provision of funds to be used as rewards. Collected fees are directed to the community pool.</Text>
      </ChainParamItem>
      <ChainParamItem name='Create Trading Reward Fee' value={rFee}>
        <Text>The Rewards module offers users the option to establish trading reward programs for specific DEX market of their choice. Setting up these programs necessitates the payment of a fee and the provision of funds to be used as rewards. Collected fees are directed to the community pool.</Text>
      </ChainParamItem>
    </ChainModuleParams>
  );
}

export default function ChainParams() {
  return (
    <Layout>
      <Box display={'block'} flexDirection={'column'}>
        <Box marginBottom={'$12'} ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>Blockchain Params</Text>
        </Box>
        <TradebinModuleParams />
        <TokenFactoryModuleParams />
        <RewardsModuleParams />
      </Box>
    </Layout>
  );
}
