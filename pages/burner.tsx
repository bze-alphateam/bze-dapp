import { Divider, Box, Text, Button, TextField, Callout } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { useEffect, useState } from "react";
import { BurnedCoinsSDKType } from "@bze/bzejs/types/codegen/beezee/burner/burned_coins";
import { BURNER, getAllBurnedCoins, getBlockTimeByHeight, getModuleAddress, getNextBurning } from "@/services";
import { amountToUAmount, getBzeDenomExponent, getChainName, getCurrentuDenom, getMinDenom, hoursUntil, minutesUntil, prettyAmount, prettyDate, prettyDateTime, toPrettyDenom, uAmountToAmount } from "@/utils";
import Long from "long";
import { parseCoins } from "@cosmjs/stargate";
import { useChain } from "@cosmos-kit/react";
import { useToast, useTx } from "@/hooks";
import { bze } from '@bze/bzejs';
import { removeBalancesCache } from "@/services/data_provider/Balances";

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

    setDate(prettyDate(new Date(blockTime)));
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
    <DefaultBorderedBox p='$6' m='$6' maxWidth={{'desktop': '20vw', mobile: '$auto'}} flex='1'>
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
        flexDirection={{'desktop': 'row', 'mobile': 'column'}}
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
    const sorted = list.burnedCoins.sort((a, b) => {
      let parsedA = parseInt(a.height);
      let parsedB = parseInt(b.height);

      return parsedB - parsedA;
    });
    
    setBurnings(sorted);
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

const { fundBurner } = bze.burner.v1.MessageComposer.withTypeUrl;

interface ContributeProps {
  onContributeSuccess?: () => void;
}

function Contribute({onContributeSuccess}: ContributeProps) {
  const [showForm, setShowForm] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitPending, setSubmitPending] = useState(false);

  const { address } = useChain(getChainName());
  const { toast } = useToast();
  const { tx } = useTx();

  const validateAmount = (amt: string): boolean => {
    let parsed = parseFloat(amt);
    if (!parsed) {
      toast({
        type: 'error',
        title: 'Invalid amount',
      });
      return false;
    }

    if (parsed <= 0) {
      toast({
        type: 'error',
        title: 'Invalid amount',
        description: 'Amount should be greater than 0'
      });
      return false;
    }

    return true;
  }

  const closeForm = () => {
    setShowForm(false);
    setAmount("");
  }

  const onSubmit = async () => {
    if (!address) {
      toast({
        type: 'error',
        title: 'Please connect your wallet',
      });
      return;
    }

    if (!validateAmount(amount)) {
      return;
    }

    setSubmitPending(true);
    let uAmount = amountToUAmount(amount, getBzeDenomExponent());
    let msg = fundBurner({
      creator: address,
      amount: `${uAmount}${getCurrentuDenom()}`
    })

    await tx([msg], {
      toast: {
        description: 'Successfully funded burner'
      },
      onSuccess: async () => {
        removeBalancesCache(address);
        removeBalancesCache(await getModuleAddress(BURNER));
        closeForm();
        if (onContributeSuccess) {
          onContributeSuccess();
        }
      }
    });
    setSubmitPending(false);
  }

  return (
    <Box display={'flex'} flexDirection={'column'} alignItems='center'>
      <Box p='$6'>
        <Text fontSize={'$lg'} fontWeight={'$bold'} color='$primary300'>Do you want to contribute ?</Text>
      </Box>
      <Box p='$6'>
        <Text fontWeight={'$thin'} fontSize={'$sm'} color='$primary200'>You can fund the next burning event with any amount of BZE you want to see burned.</Text>
      </Box>
      {
        showForm &&
        <Box p='$6'>
          <Callout
              attributes={{
                width: '$auto',
                margin: '$2'
              }}
              iconName="errorWarningLine"
              intent="error"
              title="This can not be reversed"
            >
              This operation cannot be reversed, and coins you donate for burning cannot be recovered! Once the transaction is signed, the coins are lost forever.
          </Callout>
        </Box>
      }
      <Box p='$6' flexDirection={'row'} display={'flex'} flex={1} justifyContent={'space-evenly'} alignItems={'center'} width={'100%'}>
        {
          showForm ? 
          <>
            <TextField
                id="fund-burner-amount"
                type="number"
                inputMode="numeric"
                label={""}
                size="sm"
                onChange={(e) => {setAmount(e.target.value)}}
                placeholder={"BZE amount"}
                value={amount}
                intent={'default'}
                disabled={submitPending}
              />
            <Box><Button size="sm" intent="secondary" onClick={() => {closeForm()}} isLoading={submitPending}>Cancel</Button></Box>
            <Box><Button size="sm" intent="primary" onClick={() => {onSubmit()}} isLoading={submitPending}>Burn</Button></Box>
          </> :
          <Button size="sm" intent="primary" onClick={() => {setShowForm(true)}}>Fund burner</Button>
        }
        
      </Box>
    </Box>
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
    
    setAmount(`${prettyAmount(uAmountToAmount(next.amount, 6))} ${toPrettyDenom(next.denom)} 🔥`);
    if (next.time === undefined) {
      return;
    }

    let burnDate = new Date(next.time);
    setDate(prettyDateTime(burnDate));
    let until = hoursUntil(burnDate);
    setWhen(`In ${until} hours if vote passes.`);
    if (until <= 2) {
      until = minutesUntil(burnDate);
      setWhen(`In ${until} minutes if vote passes.`);
    }
  }

  const onContributeSuccess = () => {
    fetchNextBurning();
  }

  useEffect(() => {
    fetchNextBurning();
  },[])

  return (
    <BurnBox title='Next Burning'>
      <DefaultBorderedBox p='$6' m='$6' flex='1'>
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
      <DefaultBorderedBox p='$6' m='$6' flex='1'>
        <Contribute onContributeSuccess={onContributeSuccess}/>
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
