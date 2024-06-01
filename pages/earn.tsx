import { Box, Text, Tabs } from "@interchain-ui/react";
import { Layout, MyRewards, StakingRewards } from "@/components";
import { useState } from "react";


export default function Earn() {
  const tabs = [
    {
      label: 'Staking Rewards',
      content: <StakingRewards/>,
    },
    {
      label: 'Trading Rewards',
      content: <Text>trading rewards</Text>,
    },
    {
      label: 'My Rewards',
      content: <Text>my rewards</Text>,
    }
  ]; 

  const [currentTab, setCurrentTab] = useState(0);


  const onActiveTabChange = (arg: any) => {
    setCurrentTab(arg);
  }

  return (
    <Layout>
      <Box display='flex' flexDirection={'row'} alignItems={'center'}>
        <Box marginBottom={'$12'} ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>Earn Crypto</Text>
        </Box>
      </Box >
      <Box 
        display='flex' 
        flexDirection={{desktop: 'row', mobile: 'row'}}
      >
        <Tabs
          attributes={{
            width: '$full',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          isLazy={true}
          onActiveTabChange={onActiveTabChange}
          tabs={[
            {
              content: <StakingRewards/>,
              label: 'Staking rewards'
            },
            {
              content: <h1>Tab2</h1>,
              label: 'Trading rewards'
            },
            {
              content: <MyRewards/>,
              label: 'My rewards'
            }
          ]}
        />
      </Box>
    </Layout>
  );
}
