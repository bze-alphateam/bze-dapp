import {Divider, Box, Text, Button, TextField, Callout, BasicModal} from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { useEffect, useState, memo } from "react";
import { BurnedCoinsSDKType } from "@bze/bzejs/types/codegen/beezee/burner/burned_coins";
import {
    BURNER,
    getAllBurnedCoins, getAllSupplyTokens,
    getBlockTimeByHeight, getBurnerCurrentEpoch,
    getModuleAddress,
    getNextBurning, getRaffleModuleAddress,
    getRaffles as getBlockchainRaffles, getRaffleWinners, getRestURL,
    getTokenDisplayDenom, removeRafflessCache
} from "@/services";
import {
    amountToUAmount,
    getBzeDenomExponent,
    getChainName,
    getCurrentuDenom,
    hoursUntil,
    minutesUntil,
    prettyAmount,
    prettyDate,
    prettyDateTime,
    sanitizeNumberInput,
    stringTruncateFromCenter,
    toPrettyDenom,
    uAmountToAmount
} from "@/utils";
import Long from "long";
import { parseCoins } from "@cosmjs/stargate";
import { useChain } from "@cosmos-kit/react";
import {useDisclosure, UseDisclosureReturn, useToast, useTx} from "@/hooks";
import { bze } from '@bze/bzejs';
import {getAddressBalances, removeBalancesCache} from "@/services/data_provider/Balances";
import {RaffleSDKType, RaffleWinnerSDKType} from "@bze/bzejs/types/codegen/beezee/burner/raffle";
import { DenomUnitSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import {CoinSDKType} from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";
import BigNumber from "bignumber.js";
import { useRouter } from "next/router";
import RaffleListener from "@/services/listener/RaffleListener";
import {RaffleLostEvent, RaffleWinnerEvent} from "@bze/bzejs/types/codegen/beezee/burner/events";

interface WinnersModalProps {
  control: UseDisclosureReturn;
  raffle?: RaffleBoxRaffle;
}

function WinnersModal({props}: {props: WinnersModalProps}) {
  const [winners, setWinners] = useState<RaffleWinnerSDKType[]>([]);

  const { address } = useChain(getChainName());

  useEffect(() => {
    const fetchWinners = async () => {
      if (!props.raffle?.sdk?.denom) {
        return;
      }

      const w = await getRaffleWinners(props.raffle.sdk.denom);
      setWinners(w);
    }

    fetchWinners();
  }, [props.raffle]);

  return (
    <BasicModal
      onClose={props.control.onClose}
      renderTrigger={function Va(){}}
      title={`${props.raffle?.displayDenom.denom.toUpperCase()} Raffle Winners`}
      isOpen={props.control.isOpen}
    >
      <Box display='flex' flexDirection='column' p='$6'>
        {
          winners.length >= 100 &&
          <Box mb='$6'>
            <Text color={'$orange200'}>Showing only last 100 winners</Text>
          </Box>
        }
        <Box overflowY={'scroll'} maxHeight={"30vw"} width={'$full'}>
          {winners.length === 0 ?
            <Text>No winners yet.</Text>
            :
            winners.map((winner: RaffleWinnerSDKType, index: number) => {
            const isMe = winner.winner === address;
            let textColor = '$primary200';
            if (isMe) {
              textColor =  '$green200';
            }

            return (
              <Box key={index + winner.winner} as="div" p='$2' display={'flex'} flexDirection={'row'} alignItems={'center'} flex={1}>
                <Box display={'flex'} flex={1} justifyContent={'center'}>
                  <Box display={'flex'} flex={1} flexDirection={'row'} justifyContent={'space-between'}>
                    <Text fontSize={'$lg'} color={textColor} fontWeight={'$semibold'}>{stringTruncateFromCenter(winner.winner, 12)}{isMe ? ` (You)` : undefined}</Text>
                    <Box width={'55px'}></Box>
                    <Text fontSize={'$lg'} color={textColor} fontWeight={'$semibold'}>{uAmountToAmount(winner.amount, props.raffle.displayDenom.exponent)} {props.raffle.displayDenom.denom.toUpperCase()}</Text>
                  </Box>
                </Box>
              </Box>
            )
          })}
        </Box>
      </Box>
    </BasicModal>
  )
}

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
    <DefaultBorderedBox p='$6' m='$6' maxWidth={{'desktop': '20vw', mobile: '$auto'}} minWidth={'15vw'} flex='1'>
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
    let sorted = list.burnedCoins.sort((a, b) => {
      let parsedA = parseInt(a.height);
      let parsedB = parseInt(b.height);

      return parsedB - parsedA;
    });

    //exclude burnings not related to BZE
    sorted = sorted.filter((b) => b.burned.includes(getCurrentuDenom()))

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

const { fundBurner, joinRaffle } = bze.burner.v1.MessageComposer.withTypeUrl;

interface ContributeProps {
  onContributeSuccess?: () => void;
}

function Contribute({onContributeSuccess}: ContributeProps) {
  const [showForm, setShowForm] = useState(false);
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
                type="text"
                inputMode="numeric"
                label={""}
                size="sm"
                onChange={(e) => {setAmount(sanitizeNumberInput(e.target.value))}}
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

const Intro = memo(() => {
  return (
    <>
      <Box m='$6' mt={'$12'}>
        <Text as="h2" fontSize={'$xl'}>Periodical burnings 🕓</Text>
      </Box>
      <Box display='flex' m='$6'>
        <Text fontSize={'$md'}>BZE has a burner module that destroys coins in its balance. The BZE network charges fees for different activities. Most fees go to the community pool, allowing the community to vote on whether to burn them or not. However, some coins are sent directly to the Burner Module. Coins can only be burned if the community approves it through a governance proposal. The BZE Alpha Team regularly supports burning events by proposing to move funds from the community pool or by buying back coins.</Text>
      </Box>
    </>
  );
});
Intro.displayName = 'Intro';

const RaffleIntro = memo(() => {
  return (
    <>
      <Box m='$6'>
        <Text as="h2" fontSize={'$xl'}>Burning Raffles 🏆</Text>
      </Box>
      <Box display='flex' m='$6'>
        <Text fontSize={'$md'}>Participate in Burning Raffles and win a share of the burning pot. Users can purchase a ticket to have a chance to win a percentage of the pot. Each raffle is configured at the start and has its own specifications. A percentage of the pot can be won by users who place a ticket. After placing a ticket, the blockchain will determine the outcome after two blocks to see if it is a winning ticket. If the ticket is a winner, the blockchain will automatically transfer the prize to the winning address. When the raffle ends, any remaining coins are burned.</Text>
      </Box>
    </>
  );
});
RaffleIntro.displayName = 'RaffleIntro';

interface RaffleDescriptionTextBoxProps {
  text: string;
  value: string|number;
}

const RaffleDescriptionTextBox = memo((props: RaffleDescriptionTextBoxProps) => {
  return (
    <Box p='$6' display={'flex'} flexDirection={'row'} justifyContent={'space-between'}>
      <Box>
        <Text fontSize={'$md'} color='$primary200'>{props.text}:</Text>
      </Box>
      <Box>
        <Text fontSize={'$md'} color='$primary200'>{props.value}</Text>
      </Box>
    </Box>
  )
});
RaffleDescriptionTextBox.displayName = 'RaffleDescriptionTextBox';

interface WithdrawResult {
  hasWon: boolean;
  amount: number;
  denom: string;
  address: string;
}

interface RaffleBoxRaffle {
  sdk: RaffleSDKType;
  displayDenom: DenomUnitSDKType;
  balance: CoinSDKType;
  currentEpoch: number;
  withdrawResult?: WithdrawResult;
  onWinnersClick: (raffle: RaffleBoxRaffle) => {};
}


const waitingDefault = 15;

const RafflesBoxItem = memo((props: {raffle: RaffleBoxRaffle}) => {
  const [pending, setPending] = useState(false);
  const [waitingResult, setWaitingResult] = useState(false);
  const [waitingSeconds, setWaitingSeconds] = useState(waitingDefault);

  const { address } = useChain(getChainName());
  const { toast } = useToast();
  const { tx } = useTx();

  const calculateRemaining = (endAt: number): string|undefined => {
    if (endAt <= 0 || props.raffle.currentEpoch <= 0) {
      return "Unknown..."
    }

    const diff = endAt - props.raffle.currentEpoch;
    if (diff <= 1) {
      return undefined;
    }

    if (diff <= 24) {
      return `${diff} hours`
    }

    const days = diff / 24;
    if (days <= 1) {
      return `1 day`;
    }

    return `${days} days`;
  }

  const calculateCurrentPrize = (raffle: RaffleBoxRaffle): string => {
    const balNum = new BigNumber(raffle.balance.amount);
    if (balNum.isLessThanOrEqualTo(0)) {
      return `0 ${raffle.balance.denom.toUpperCase()}`;
    }

    const prize = balNum.multipliedBy(raffle.sdk.ratio);

    return `${uAmountToAmount(prize.toString(), raffle.displayDenom.exponent)} ${raffle.displayDenom.denom.toUpperCase()}`;
  }

  const submitTicket = async (raffle: RaffleBoxRaffle) => {
    if (!address) {
      toast({
        type: 'error',
        title: 'Please connect your wallet',
      });
      return;
    }

    setPending(true);
    let expectedSeconds = waitingDefault;
    let msg = joinRaffle({
      creator: address,
      denom: raffle.sdk.denom
    })

    await tx([msg], {
      toast: {
        description: 'Successfully joined raffle'
      },
      onSuccess: async (res) => {
        //TODO: fetch the block by res.height + 2 if the websocket doesnt update the flag here
        setWaitingSeconds(expectedSeconds);
        setWaitingResult(true);
        let intrvl = setInterval(() => {
          expectedSeconds--;
          setWaitingSeconds(expectedSeconds);
        }, 1000)
        setTimeout(() => {
          setWaitingSeconds(0);
          clearInterval(intrvl);
        }, waitingDefault * 1000)
      },
    });

    setPending(false);
  }

  const remaining = calculateRemaining(Long.fromString(props.raffle.sdk.end_at.toString()).toNumber());
  const ticketPrice = uAmountToAmount(props.raffle.sdk.ticket_price, props.raffle.displayDenom.exponent)

  useEffect(() => {
    if (props.raffle.withdrawResult) {
      setPending(false);
      setWaitingResult(false);
      setWaitingSeconds(waitingDefault);
    }
  }, [props.raffle.withdrawResult])

  return (
    <DefaultBorderedBox p='$2' m='$2' flex='1' key={props.raffle.sdk.denom}>
      <Box flex={1} display={'flex'} flexDirection={{'mobile': 'column', desktop: 'row'}} alignItems={{mobile: 'center', desktop: 'center'}} justifyContent={{mobile: undefined, desktop: 'space-between'}}>
        <Box p='$6'>
          <Text fontSize={'$lg'} fontWeight={'$bold'} color='$primary300'>{props.raffle.displayDenom.denom.toUpperCase()} Raffle</Text>
        </Box>
        <Box p='$6'>
          <Text fontSize={'$lg'} color='$primary300'> Ticket price: {ticketPrice} {props.raffle.displayDenom.denom.toUpperCase()}</Text>
        </Box>
        <Box p='$6'>
          <Text fontSize={'$lg'} color='$primary300'> Chances: 1 out of {prettyAmount(Long.fromNumber(1_000_000).div(props.raffle.sdk.chances).toNumber())} </Text>
        </Box>
      </Box>
      <Divider />
      <Box flex={1} display={'flex'} flexDirection={{'mobile': 'column-reverse', desktop: 'row'}} justifyContent={'space-evenly'}>
        <Box>
          <Box minWidth={{mobile: '$auto', desktop: '500px'}} flex={1} display={'flex'} flexDirection={'column'} justifyContent={'space-between'}>
            <RaffleDescriptionTextBox text={'Winners'} value={props.raffle.sdk.winners.toString()} />
            <RaffleDescriptionTextBox text={'Total won'} value={`${uAmountToAmount(props.raffle.sdk.total_won, props.raffle.displayDenom.exponent)} ${props.raffle.displayDenom.denom.toUpperCase()}`} />
            <RaffleDescriptionTextBox text={'Remaining'} value={remaining ?? 'Finished'} />
          </Box>
          <Box flex={1} display={'flex'} flexDirection={{'mobile': 'column', desktop: 'row'}} justifyContent={'space-evenly'}>
            <Box p='$6'>
              {/*<Button size="sm" intent="secondary" onClick={()=> window.open(`${getRestURL()}/bze/burner/v1/raffle_winners?denom=${props.raffle.sdk.denom}`, "_blank")}>View winners</Button>*/}
              <Button size="sm" intent="secondary" onClick={()=> props.raffle.onWinnersClick(props.raffle)}>View winners</Button>
            </Box>
          </Box>
        </Box>
        <DefaultBorderedBox flex={1} display={'flex'} m={'$6'} p={'$6'} boxShadow={undefined} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
          <Box p='$6'>
            <Text fontSize={'$lg'} fontWeight={'$bold'}  color='$primary300'>Current Prize: ~{calculateCurrentPrize(props.raffle)}</Text>
          </Box>
          <Box p='$6'>
            <Text fontSize={'$sm'} color='$primary200' fontWeight={'$hairline'}>You will pay {ticketPrice} {props.raffle.displayDenom.denom.toUpperCase()} to try your luck.</Text>
          </Box>
          <Box p='$6'>
            <Button size="sm" intent="primary" disabled={(remaining === undefined) || pending} isLoading={pending || waitingResult} onClick={() => submitTicket(props.raffle)}>Try your luck</Button>
          </Box>
          <Box p='$2'>
            {pending && !waitingResult && <Text fontSize={'$sm'} fontWeight={"$light"} color='$green200'>Submitting transaction...</Text>}
            {!pending && waitingResult && <Text fontSize={'$sm'} fontWeight={"$light"} color='$green200'>Waiting for result... ({waitingSeconds}s)</Text>}
            {!pending && !waitingResult && props.raffle.withdrawResult && !props.raffle.withdrawResult.hasWon && <Text fontSize={'$sm'} fontWeight={"$light"} color='$red200'>Unlucky! 😔 Better luck next time!</Text>}
            {!pending && !waitingResult && props.raffle.withdrawResult?.hasWon && <Text fontSize={'$sm'} fontWeight={"$light"} color='$green200'>You won {uAmountToAmount(props.raffle.withdrawResult.amount, props.raffle.displayDenom.exponent)} {props.raffle.displayDenom.denom.toUpperCase()}! 🥳</Text>}
          </Box>
        </DefaultBorderedBox>
      </Box>
    </DefaultBorderedBox>
  )
});
RafflesBoxItem.displayName = 'RafflesBoxItem';

function RafflesBox() {
  const [raffles, setRaffles] = useState<RaffleBoxRaffle[]>([]);
  const [modalRaffle, setModaLRaffle] = useState<RaffleBoxRaffle>();

  const router = useRouter();
  const { address } = useChain(getChainName());
  const winnerDisclosure = useDisclosure();

  const onRaffleWinnersClick = async (raffle: RaffleBoxRaffle) => {
     setModaLRaffle(raffle);
     winnerDisclosure.onOpen();
  }

  const getRaffles = async (): Promise<RaffleBoxRaffle[]> => {
    const addr = await getRaffleModuleAddress();
    const [data, allTokens, balances, epoch] = await Promise.all([getBlockchainRaffles(), getAllSupplyTokens(), getAddressBalances(addr), getBurnerCurrentEpoch()]);
    if (data === undefined) {
      return [];
    }

    const boxRaffles: RaffleBoxRaffle[] = [];
    for (let i = 0; i < data.length; i++) {
      const raffleToken = allTokens.get(data[i].denom)
      if (!raffleToken) {
        continue;
      }

      let display = await getTokenDisplayDenom(data[i].denom, raffleToken);
      if (display.exponent === 0) {
        continue;
      }

      const pot = balances.balances.find(item => item.denom === data[i].denom)
      if (!pot) {
        continue;
      }

      const raff = {
        sdk: data[i],
        displayDenom: display,
        balance: pot,
        currentEpoch: epoch,
        onWinnersClick: onRaffleWinnersClick
      };

      boxRaffles.push(raff)
    }

    return boxRaffles;
  }

  const fetchRaffles = async () => {
    const boxRaffles = await getRaffles();
    setRaffles(boxRaffles);
  }

  const onRaffleLost = async (event: RaffleLostEvent) => {
    const addr = await getRaffleModuleAddress();
    removeBalancesCache(addr);
    const copiedRaffles = await getRaffles();
    if (event.participant !== address) {
      setRaffles(copiedRaffles);
      return;
    }

    for (let i = 0; i < copiedRaffles.length; i++) {
      const current = copiedRaffles[i];
      if (event.denom !== current.sdk.denom) {
        continue;
      }

      current.withdrawResult = {
        hasWon: false,
        address: event.participant,
        amount: 0,
        denom: event.denom
      };

      copiedRaffles[i] = current;
      break;
    }

    setRaffles(copiedRaffles);
  }

  const onRaffleWinner = async (event: RaffleWinnerEvent) => {
    removeRafflessCache();
    const addr = await getRaffleModuleAddress();
    removeBalancesCache(addr);
    const boxRaffles = await getRaffles();

    //if we didn't win stop
    if (event.winner !== address) {
      setRaffles(boxRaffles);
      return;
    }

    //search the raffle we won and add the withdrawResult
    for (let i = 0; i < boxRaffles.length; i++) {
      const current = boxRaffles[i];
      if (event.denom !== current.sdk.denom) {
        continue;
      }

      current.withdrawResult = {
        hasWon: true,
        address: event.winner,
        amount: parseInt(event.amount),
        denom: event.denom
      };

      boxRaffles[i] = current;
      break;
    }

    setRaffles(boxRaffles);
  }

  useEffect(() => {
    const onRouteChange = () => {
      RaffleListener.clearAllCallbacks();
      RaffleListener.stop();
    };

    router.events.on('routeChangeStart', onRouteChange)

    // If the component is unmounted, unsubscribe
    // from the event with the `off` method:
    return () => {
      router.events.off('routeChangeStart', onRouteChange);
    }
  }, [router]);

  useEffect(() => {
    RaffleListener.clearAllCallbacks();
    RaffleListener.addRaffleLostCallback((e: RaffleLostEvent) => {
      onRaffleLost(e);
    })
    RaffleListener.addRaffleWinnerCallback((e: RaffleWinnerEvent) => {
      onRaffleWinner(e);
    })

    RaffleListener.start();
  },[address])

  useEffect(() => {
    fetchRaffles();
  },[])


  return (
    <BurnBox title='Raffles'>
      <WinnersModal props={{control: winnerDisclosure, raffle: modalRaffle }}/>
      <Box p='$2' m='$6' flex='1'>
        <Box display={'flex'} flexDirection={'column'} alignItems='stretch'>
          {raffles.length === 0 ?
            (<Box flex={1} display={'flex'} justifyContent={'center'} ><Text>No active raffles found. Try again later...</Text></Box>) :
            raffles.map((raff) => (
              <RafflesBoxItem key={raff.sdk.denom} raffle={raff} />
            ))
          }
        </Box>
      </Box>
    </BurnBox>
  );
}

export default function Burner() {
  return (
    <Layout>
      <Box display={'block'} flexDirection={'column'}>
        <Box mb='$12' ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>Burner 🔥</Text>
        </Box>
        <Box>
          <RaffleIntro />
          <RafflesBox />
          <Intro />
          <NextBurning />
          <BurnHistory />
        </Box>
      </Box>
    </Layout>
  );
}
