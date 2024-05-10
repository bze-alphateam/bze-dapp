import { Divider, Box, Text } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { useEffect, useState } from "react";
import { BurnedCoinsSDKType } from "@bze/bzejs/types/codegen/beezee/burner/burned_coins";
import { getAllBurnedCoins, getBlockTimeByHeight, getNextBurning } from "@/services";
import { hoursUntil, minutesUntil, prettyAmount, prettyDate, prettyDateTime, toPrettyDenom, uAmountToAmount } from "@/utils";
import Long from "long";
import { parseCoins } from "@cosmjs/stargate";

function BurnCard({burned}: {burned: BurnedCoinsSDKType}) {
  const [amount, setAmount] = useState<string>('Loading...');
  const [date, setDate] = useState<string>('Loading...');
  const [height, setHeight] = useState<string>('Loading...');

  const fetchTime = async (burned: BurnedCoinsSDKType) => {
    let blockTime = await getBlockTimeByHeight(Long.fromString(burned.height));
    if (blockTime === undefined) {
      setDate('Unknown');
      return;
    }

    setDate(prettyDate(blockTime));
  }

  useEffect(() => {
    fetchTime(burned);
    let parsed = parseCoins(burned.burned);
    if (parsed.length > 0) {
      let coin = parsed[0];
      setAmount(`${prettyAmount(uAmountToAmount(coin.amount, 6))} ${toPrettyDenom(coin.denom)} 🔥`);
    }
    setHeight(burned.height);
  },[burned]);

  return (
    <DefaultBorderedBox p='$6' m='$6' maxWidth={'20vw'} flex='1'>
      <Box display={'flex'} flexDirection={'column'} alignItems='center'>
        <Box p='$6'>
          <Text fontSize={'$lg'} fontWeight={'$bold'} color='$primary200'>{amount}</Text>
        </Box>
        <Box p='$6' fontWeight={'$bold'}>
          <Text fontSize={'$md'} color='$primary100'> {date}</Text>
        </Box>
        <Box p='$6'>
          <Text fontWeight={'$thin'} fontSize={'$sm'} color='$primary100'> At height {height}</Text>
        </Box>
      </Box>
    </DefaultBorderedBox>
  );
}

function BurnBox({ children, title }: { children: React.ReactNode, title: string}) {
  return (
    <DefaultBorderedBox mt='$12' mx='$6'>
      <Box m='$6'>
        <Text as="h3" textAlign='center' fontSize='$md'>{title}</Text>
      </Box>
      <Divider />
      <Box 
        display={'flex'} 
        flex={1} 
        flexWrap='wrap' 
        flexGrow={1} 
        justifyContent='center'
      >
        {children}
      </Box>
    </DefaultBorderedBox>
  );
}

function BurnHistory() {
  const [loading, setLoading] = useState<boolean>(true);
  const [burnings, setBurnings] = useState<BurnedCoinsSDKType[]>([]);

  const fetchBurnings = async () => {
    const list = await getAllBurnedCoins();
    setBurnings(list.burnedCoins);
    setLoading(false);
  }

  useEffect(() => {
    fetchBurnings();
  }, [])


  return (
    <BurnBox title='Burning History'>
      {
        loading ? <Text>Loading...</Text> :
        burnings.map((burn: BurnedCoinsSDKType) => (
          <BurnCard key={burn.height} burned={burn}/>
        ))
      }
    </BurnBox>    
  );
}

function NextBurning() {
  const [amount, setAmount] = useState<string>('A lot of BZE 🔥');
  const [date, setDate] = useState<string>('To Be Announced');
  const [when, setWhen] = useState<string>('A few times each year...');

  const fetchNextBurning = async () => {
    let next = await getNextBurning();
    if (next === undefined) {
      return;
    }
    let burnDate = new Date(next.time);


    setAmount(`${prettyAmount(uAmountToAmount(next.amount, 6))} ${toPrettyDenom(next.denom)} 🔥`);
    setDate(prettyDateTime(burnDate));
    let until = hoursUntil(burnDate);
    setWhen(`In ${until} hours if vote passes.`);
    if (until <= 2) {
      until = minutesUntil(burnDate);
      setWhen(`In ${until} minutes if vote passes.`);
    }
  }

  useEffect(() => {
    fetchNextBurning();
  },[])

  return (
    <BurnBox title='Next Burning'>
      <DefaultBorderedBox p='$6' m='$6' maxWidth={'20vw'} flex='1'>
      <Box display={'flex'} flexDirection={'column'} alignItems='center'>
        <Box p='$6'>
          <Text fontSize={'$lg'} fontWeight={'$bold'} color='$primary300'>{amount}</Text>
        </Box>
        <Box p='$6' fontWeight={'$bold'}>
          <Text fontSize={'$md'} color='$primary200'> {date}</Text>
        </Box>
        <Box p='$6'>
          <Text fontWeight={'$thin'} fontSize={'$sm'} color='$primary200'>{when}</Text>
        </Box>
      </Box>
    </DefaultBorderedBox>
    </BurnBox> 
  );
}

function Intro() {
  return (
    <>
      <Box m='$6'>
        <Text as="h2" fontSize={'$xl'}>The goal</Text>
      </Box>
      <Box display='flex' m='$6'>
        <Text fontSize={'$md'}>BZE has a burner module that destroys coins in its balance. The BZE network charges fees for different activities. Most fees go to the community pool, allowing the community to vote on whether to burn them or not. However, some coins are sent directly to the Burner Module. Coins can only be burned if the community approves it through a governance proposal. The BZE Alpha Team regularly supports burning events by proposing to move funds from the community pool or by buying back coins.</Text>
      </Box>
    </>
  );
}

export default function Burner() {
  return (
    <Layout>
      <Box display={'block'} flexDirection={'column'}>
        <Box mb='$12' ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>BZE Burnings 🔥</Text>
        </Box>
        <Box>
          <Intro />
          <NextBurning />
          <BurnHistory />
        </Box>
      </Box>
    </Layout>
  );
}
