import { Box, Text, Button, TextField, FieldLabel, Callout } from "@interchain-ui/react";
import { DefaultBorderedBox, StakingRewardDetailsBox } from "@/components";
import { useEffect, useState } from "react";
import { StakingRewardSDKType } from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward";
import { Token, getAllSupplyTokens, getRewardsParams, getTokenDisplayDenom } from "@/services";
import { SearchInput } from "@/components/common/Input";
import SelectAssetModal from "@/components/wallet/SelectAssetModal";
import { useDisclosure, useToast, useTx } from "@/hooks";
import { amountToUAmount, getChainName, isGreaterOrEqualToZero, isGreaterThanZero, prettyAmount, prettyFee } from "@/utils";
import BigNumber from "bignumber.js";
import { DeliverTxResponse } from "@cosmjs/stargate";
import { bze } from '@bze/bzejs';
import { useChain } from "@cosmos-kit/react";
import { getStakingRewards, resetStakingRewardsCache } from "@/services/data_provider/StakingReward";

const { createStakingReward, joinStaking } = bze.v1.rewards.MessageComposer.withTypeUrl;

export interface StakingRewardDetailProps {
  reward: StakingRewardSDKType;
  tokens: Map<string, Token>;
  refreshList?: () => void;
}

function StakingRewardDetail({props}: {props: StakingRewardDetailProps}) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState();
  const [submitPending, setSubmitPending] = useState(false);

  const [stakingToken, setStakingToken] = useState<Token>();
  const [prizeToken, setPrizeToken] = useState<Token>();

  const { toast } = useToast();
  const { tx } = useTx();
  const { address } = useChain(getChainName());

  const cancelForm = () => {
    setShowForm(false);
    setAmount(undefined);
  }

  const submitStake = async () => {
    if (stakingToken === undefined || amount === undefined) {
      return;
    }

    setSubmitPending(true);
    if (!isGreaterThanZero(amount)) {
      toast({
        title: 'Invalid staking amount',
        description: 'Please insert positive amount',
        type: 'error'
      });

      setSubmitPending(false);

      return;
    }

    const stakingDenomUnit = await getTokenDisplayDenom(stakingToken.metadata.base, stakingToken);
    const convertedAmount = amountToUAmount(amount, stakingDenomUnit.exponent);
    const msg = joinStaking({
      amount: convertedAmount,
      creator: address ?? "",
      rewardId: props.reward.reward_id,
    });

    await tx([msg], {
      toast: {
        description: 'Successfully joined staking reward',
      },
      onSuccess: () => {
        props.refreshList ? props.refreshList() : null;
        setShowForm(false);
      }
    });
    
    setSubmitPending(false);
  };

  useEffect(() => {
    setPrizeToken(props.tokens.get(props.reward.prize_denom));
    setStakingToken(props.tokens.get(props.reward.staking_denom));
  }, [props]);

  if (prizeToken === undefined || stakingToken === undefined) {
    return <></>
  }

  return (
    <StakingRewardDetailsBox prizeToken={prizeToken} stakingToken={stakingToken} reward={props.reward}>
      {!showForm ? 
        <Box display={'flex'} flex={1} flexDirection={'row'} alignItems={'center'} justifyContent={'center'} mt={'$6'} flexWrap={'wrap'}>
          <Button size='sm' intent="primary" onClick={() => {setShowForm(true)}}>Stake</Button>
        </Box>
        :
        <Box mt={'$6'}>
          <TextField
            size='sm'
            id="stake_amount"
            label={"Stake " + stakingToken.metadata.display}
            onChange={(e) => {setAmount(e.target.value)}}
            placeholder="Amount"
            value={amount ?? ""}
            type="number"
            disabled={submitPending}
          />
          <Box mt='$6' display='flex' flexDirection={'row'} justifyContent={'space-around'}>
            <Button size='sm' intent="secondary" onClick={cancelForm} disabled={submitPending}>Cancel</Button>
            <Button size='sm' intent="primary" onClick={submitStake} isLoading={submitPending} >Stake</Button>
          </Box>
        </Box>  
      }
    </StakingRewardDetailsBox>
  );
}

interface AddStakingRewardFormProps {
  onCancel: () => void,
  onSuccess: () => void,
}

function AddStakingRewardForm({props}: {props: AddStakingRewardFormProps}) {
  //this state
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [createFee, setCreateFee] = useState<string>("");
  
  //form state
  const [prizeAmount, setPrizeAmount] = useState<string>("");
  const [selectedPrizeDenom, setSelectedPrizeDenom] = useState<Token|undefined>();
  const [duration, setDuration] = useState<number|undefined>();
  const [selectedStakingDenom, setSelectedStakingDenom] = useState<Token|undefined>();
  const [minStake, setMinStake] = useState<number|undefined>();
  const [lock, setLock] = useState<number|undefined>();
  const [validForm, setValidForm] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);

  //modals state
  const prizeDenomDisclosure = useDisclosure();
  const stakingDenomDisclosure = useDisclosure();

  const { toast } = useToast();
  const { tx } = useTx();
  const { address } = useChain(getChainName());

  const onPrizeDenomSelect = (token: Token) => {
    setSelectedPrizeDenom(token);
    prizeDenomDisclosure.onClose();
  }

  const onStakingDenomSelect = (token: Token) => {
    setSelectedStakingDenom(token);
    stakingDenomDisclosure.onClose();
  }

  const validateCreateForm = (): boolean => {
    if (!isGreaterThanZero(prizeAmount)) {
      toast({
        title: 'Invalid staking reward',
        description: 'Please insert a valid prize amount',
        type: 'error'
      });

      return false;
    }
    if (selectedPrizeDenom === undefined) {
      toast({
        title: 'Invalid staking reward',
        description: 'Please select prize denom!',
        type: 'error'
      });

      return false;
    }

    if (!isGreaterThanZero(duration)) {
      toast({
        title: 'Invalid staking reward',
        description: 'Please insert a duration greater than 0.',
        type: 'error'
      });

      return false;
    }

    if (selectedStakingDenom === undefined) {
      toast({
        title: 'Invalid staking reward',
        description: 'Please select staking denom!',
        type: 'error'
      });

      return false;
    }

    if (minStake == undefined || !isGreaterOrEqualToZero(minStake)) {
      toast({
        title: 'Invalid staking reward',
        description: 'Please insert a valid minimum stake.',
        type: 'error'
      });

      return false;
    }

    if (lock == undefined || !isGreaterOrEqualToZero(lock)) {
      toast({
        title: 'Invalid staking reward',
        description: 'Please insert a valid locking period.',
        type: 'error'
      });

      return false;
    }

    return true;
  }

  const onFormSubmit = () => {
    if (!validateCreateForm()) {
      setValidForm(false);
      return;
    }

    setValidForm(true);
  }

  const submitTransaction = async () => {
    //should never happen
    if (!validForm) {
      return;
    }

    //should never happen
    if (address === "" || duration === undefined || lock === undefined || minStake === undefined || selectedPrizeDenom === undefined || selectedStakingDenom === undefined) {
      return;
    }

    const [prizeDenomUnit, stakingDenomUnit] = await Promise.all(
      [
        getTokenDisplayDenom(selectedPrizeDenom.metadata.base, selectedPrizeDenom),
        getTokenDisplayDenom(selectedStakingDenom.metadata.base, selectedStakingDenom)
      ]
    );

    const convertedMinStake = amountToUAmount(minStake, stakingDenomUnit.exponent);
    const convertedPrizeAmount = amountToUAmount(prizeAmount, prizeDenomUnit.exponent);

    setSubmitPending(true);
    const msg = createStakingReward({
      creator: address ?? "",
      duration: duration.toString(),
      lock: lock.toString(),
      minStake: convertedMinStake,
      prizeDenom: selectedPrizeDenom.metadata.base,
      prizeAmount: convertedPrizeAmount,
      stakingDenom: selectedStakingDenom.metadata.base,
    });

    await tx([msg], {
      toast: {
        description: 'The trading reward has been submitted!'
      },
      onSuccess: (res: DeliverTxResponse) => {
        props.onSuccess ? props.onSuccess() : null;
      },
    });
    
    setValidForm(false);
    setSubmitPending(false);
    
  }

  const calculateAmountToPay = (): string => {
    if (duration == undefined || prizeAmount == undefined) {
      return "unknown amount"
    }

    const prize = new BigNumber(prizeAmount).multipliedBy(duration);

    return `${prize.toString()} ${selectedPrizeDenom?.metadata.display}`;
  }

  useEffect(() => {
    const fetchTokens = async () => {
      const all = await getAllSupplyTokens();
      setAllTokens(Array.from(all.values()));
    }

    const fetchParams = async () => {
      let params = await getRewardsParams();
      if (params.params === undefined) {
        setCreateFee('an unknown');
  
        return;
      }
  
      setCreateFee(prettyFee(params.params.createStakingRewardFee));
    }

    fetchParams();
    fetchTokens();
  }, []);

  return (
    <>
      <SelectAssetModal props={{control: prizeDenomDisclosure, onClick: onPrizeDenomSelect, list: allTokens}}/>
      <SelectAssetModal props={{control: stakingDenomDisclosure, onClick: onStakingDenomSelect, list: allTokens}}/>
      <DefaultBorderedBox p='$6' mt='$6'>
        <Box display={'flex'} flexDirection={'row'} alignItems={'end'} gap={'$6'} flexWrap={'wrap'} justifyContent={'center'}>
          <Box>
            <TextField
              size='sm'
              id="prize_amount"
              label="Daily reward"
              onChange={(e) => {setPrizeAmount(e.target.value)}}
              placeholder="Amount"
              value={prizeAmount}
              type="number"
              // intent={inputIntent}
              disabled={validForm}
            />
          </Box>
          <Box p='$2'>
            <FieldLabel htmlFor="pick-denom-1" label={"Reward coin"} attributes={{marginBottom: '10px'}}></FieldLabel>
            <Button intent="text" key={"pick-denom-1"} disabled={validForm} size='sm' leftIcon={selectedPrizeDenom === undefined ? "add": undefined} onClick={prizeDenomDisclosure.onOpen}>{selectedPrizeDenom === undefined ? "Pick coin" : selectedPrizeDenom.metadata.name}</Button>
          </Box>
          <Box>
            <TextField
              size='sm'
              id="duration"
              label="Reward duration"
              onChange={(e) => {setDuration(e.target.value)}}
              placeholder="No. of days"
              value={`${duration}`}
              type="number"
              disabled={validForm}
            />
          </Box>
          <Box p='$2'>
            <FieldLabel htmlFor="pick-denom-2" label={"Staking coin"} attributes={{marginBottom: '10px'}}></FieldLabel>
            <Button intent="text" key={"pick-denom-2"} disabled={validForm} size='sm' leftIcon={selectedStakingDenom === undefined ? "add": undefined} onClick={stakingDenomDisclosure.onOpen}>{selectedStakingDenom === undefined ? "Pick coin" : selectedStakingDenom.metadata.name}</Button>
          </Box>
          <Box>
            <TextField
              size='sm'
              id="min_stake"
              label="Min stake"
              onChange={(e) => {setMinStake(e.target.value !== "" ? e.target.value : undefined)}}
              placeholder="Min stake amount"
              value={`${minStake}`}
              type="number"
              inputMode="text"
              disabled={validForm}
            />
          </Box>
          <Box>
            <TextField
              size='sm'
              id="lock"
              label="Unstake lock"
              onChange={(e) => {setLock(e.target.value !== "" ? e.target.value : undefined)}}
              placeholder="No. of days"
              value={`${lock}`}
              type="number"
              inputMode="numeric"
              disabled={validForm}
            />
          </Box>
        </Box>
        <Box p='$6' mt='$12' display={'flex'} flexDirection={'row'} alignItems={'center'} justifyContent={'center'} gap={'$6'} flexWrap={'wrap'}>
          {validForm ? 
            <>
              <Box textAlign={"center"}>
                <Callout
                  attributes={{
                    width: '$auto',
                    // marginTop: '$2'
                  }}
                  iconName="informationLine"
                  intent="info"
                  title="Summary"
                >
                    You are creating a staking reward that will distribute {prettyAmount(prizeAmount)} {selectedPrizeDenom?.metadata.display} every day, for a period of {duration} days, to all the users that stake {minStake !== undefined ? prettyAmount(minStake) : 0} {selectedStakingDenom?.metadata.display} or more. The staked amounts will be locked for {lock ?? 0} days.
                </Callout>
                <Callout
                  attributes={{
                    width: '$auto',
                    marginTop: '$6'
                  }}
                  iconName="errorWarningLine"
                  intent="warning"
                  title="Warning"
                >
                  You will pay {createFee} fee for creating the staking reward and {calculateAmountToPay()} will be captured from your wallet by the blockchain in order to pay for the rewards. This action can NOT be undone and the staking reward can NOT be edited or refunded.
                </Callout>
              </Box>
              <Button intent="secondary" size='sm' onClick={() => {setValidForm(false)}} disabled={submitPending}>Cancel</Button>
              <Button intent="primary" size='sm' onClick={() => {submitTransaction()}} isLoading={submitPending}>Confirm</Button>
            </>
            : 
            <>
              <Button intent="secondary" key={"cancel-reward"} size='sm' onClick={props.onCancel}>Cancel</Button>
              <Button intent="primary" key={"create-reward"} size='sm' onClick={onFormSubmit}>Create reward</Button>
            </>
          }
        </Box>
      </DefaultBorderedBox>
    </>
  );
}

export function StakingRewards() {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<StakingRewardSDKType[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<StakingRewardSDKType[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [allAssets, setAllAssets] = useState<Map<string, Token>>(new Map());

  const { address } = useChain(getChainName());

  const fetchStakingRewards = async () => {
    const all = await getStakingRewards();
    setRewards(all.list);
    setFilteredRewards(all.list);
  }
  
  const fetchTokens = async () => {
    const all = await getAllSupplyTokens();
    setAllAssets(all);
  }

  const onNewStakingReward = async () => {
    setShowAddForm(false);
    await resetStakingRewardsCache(address);
    await fetchStakingRewards();
  };

  const onSearchSubmit = async (query: string) => {
    if (query === "") {
      setFilteredRewards(rewards);
      return;
    }

    let lowerQuery = query.toLowerCase();
    const tokensSearch = Array.from(allAssets.values()).filter((token: Token) => {
      return token.metadata.base.toLowerCase().includes(lowerQuery) ||
        token.metadata.display.toLowerCase().includes(lowerQuery) ||
        token.metadata.name.toLowerCase().includes(lowerQuery) ||
        token.metadata.symbol.toLowerCase().includes(lowerQuery)
    });

    if (tokensSearch.length === 0) {
      setFilteredRewards([]);
      return;
    }

    const result = rewards.filter((item: StakingRewardSDKType) => {
      let rewardAsset = tokensSearch.find((token: Token) => token.metadata.base === item.staking_denom || token.metadata.base === item.prize_denom);
      
      return rewardAsset !== undefined;
    });

    setFilteredRewards(result);
  }

  const initialLoad = async () => {
    setLoading(true);
    await Promise.all([
      fetchStakingRewards(),
      fetchTokens()
    ]);
    setLoading(false);
  }

  const forceListRefresh = async () => {
    await resetStakingRewardsCache(address);
    initialLoad();
  }

  useEffect(() => {
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <DefaultBorderedBox p='$6' m='$6'>
        <Box display={'flex'} flex={1} flexDirection={'row'} alignItems={'center'}>
          <Box>
            {!showAddForm && <Button size="sm" intent="primary" onClick={() => {setShowAddForm(true)}}>Add Staking Reward</Button>}
          </Box>
          <Box display={'flex'} justifyContent={'flex-end'} flex={1}>
            <SearchInput placeholder='Search by asset' width={20} onSubmit={onSearchSubmit}/>
          </Box>
        </Box>
        {showAddForm &&
          <>
            {/* <Divider mx='$6'/> */}
            <AddStakingRewardForm props={{onCancel: () => {setShowAddForm(false)}, onSuccess: () => {onNewStakingReward()}}}/>
          </>
        }
      </DefaultBorderedBox>
      <Box 
        flexDirection={{desktop: 'row', mobile: 'column'}} 
        display={'flex'}
        flexWrap={'wrap'}
        justifyContent={'center'}
        >
        {loading ? 
          <Box p='$6' m='$6' textAlign={'center'} display={'flex'} flex={1} justifyContent={'center'}><Text>Loading ...</Text></Box>
          :
          filteredRewards.map((rew, index) => (
            <StakingRewardDetail props={{reward: rew, tokens: allAssets, refreshList: forceListRefresh}} key={index}/>
          ))  
        } 
      </Box>
    </Box>
  );
}
