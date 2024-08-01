import { Divider, Box, Text, Button, TextField, Callout } from "@interchain-ui/react";
import { DefaultBorderedBox, StakingRewardDetailProps, StakingRewardDetailsBox, StakingRewardDetailsBoxRow } from "@/components";
import { useEffect, useState } from "react";
import { StakingRewardSDKType } from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward";
import { Token, getAllSupplyTokens, getTokenDisplayDenom } from "@/services";
import { SearchInput } from "@/components/common/Input";
import { useToast, useTx } from "@/hooks";
import { amountToUAmount, getChainName, isGreaterThanZero, prettyAmount, sanitizeNumberInput, uAmountToAmount } from "@/utils";
import BigNumber from "bignumber.js";
import { bze } from '@bze/bzejs';
import { useChain } from "@cosmos-kit/react";
import { getAddressStakingRewards, resetStakingRewardsCache } from "@/services/data_provider/StakingReward";
import { DenomUnitSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import WalletConnectCallout from "@/components/wallet/WalletCallout";
import { StakingRewardParticipantSDKType } from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward_participant";

const { joinStaking, exitStaking, claimStakingRewards } = bze.v1.rewards.MessageComposer.withTypeUrl;

interface MyRewardDetailProps extends StakingRewardDetailProps {
  participant?: StakingRewardParticipantSDKType;
}

function MyRewardDetail({props}: {props: MyRewardDetailProps}) {
  const [confirmUnstake, setConfirmUnstake] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [stakingToken, setStakingToken] = useState<Token>();
  const [prizeToken, setPrizeToken] = useState<Token>();
  const [stakingDisplayDenom, setStakingDisplayDenom] = useState<DenomUnitSDKType>();
  const [prizeDisplayDenom, setPrizeDisplayDenom] = useState<DenomUnitSDKType>();
  const [claimable, setClaimable] = useState(new BigNumber(0));
  const [amount, setAmount] = useState<string>("");

  const { tx } = useTx();
  const { address } = useChain(getChainName());
  const { toast } = useToast();

  const cancelUnstake = () => {
    setConfirmUnstake(false);
  }

  const unstake = async () => {
    if (stakingToken === undefined) {
      return;
    }

    setSubmitPending(true);
    const msg = exitStaking({
      creator: address ?? "",
      rewardId: props.reward.reward_id,
    });

    await tx([msg], {
      toast: {
        description: 'Successfully unstaked all coins',
      },
      onSuccess: () => {
        props.refreshList ? props.refreshList() : null;
        setConfirmUnstake(false);
      }
    });
    
    setSubmitPending(false);
  };

  const claim = async () => {
    if (stakingToken === undefined) {
      return;
    }

    setSubmitPending(true);
    const msg = claimStakingRewards({
      creator: address ?? "",
      rewardId: props.reward.reward_id,
    });

    await tx([msg], {
      toast: {
        description: 'Successfully claimed rewards',
      },
      onSuccess: () => {
        props.refreshList ? props.refreshList() : null;
        setClaimable(new BigNumber(0));
      }
    });
    
    setSubmitPending(false);
  };

  const cancelForm = () => {
    setShowForm(false);
    setAmount("");
  }

  const submitStake = async () => {
    if (stakingToken === undefined || amount === undefined || stakingDisplayDenom === undefined) {
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

    const convertedAmount = amountToUAmount(amount, stakingDisplayDenom.exponent);
    const msg = joinStaking({
      amount: convertedAmount,
      creator: address ?? "",
      rewardId: props.reward.reward_id,
    });

    await tx([msg], {
      toast: {
        description: 'Stake successfully added',
      },
      onSuccess: () => {
        props.refreshList ? props.refreshList() : null;
        setShowForm(false);
      }
    });
    
    setSubmitPending(false);
  };

  useEffect(() => {
    let pToken = props.tokens.get(props.reward.prize_denom);
    setPrizeToken(pToken);
    let sToken = props.tokens.get(props.reward.staking_denom);
    setStakingToken(sToken);
    if (sToken !== undefined && pToken !== undefined && props.participant !== undefined) {
      setStakingDisplayDenom(sToken.metadata.denom_units.find((denom: DenomUnitSDKType) => denom.denom === sToken?.metadata.display));
      setPrizeDisplayDenom(pToken.metadata.denom_units.find((denom: DenomUnitSDKType) => denom.denom === pToken?.metadata.display));
      let distr = new BigNumber(props.reward.distributed_stake);
      let joinedAt = new BigNumber(props.participant.joined_at);
      if (distr.isEqualTo(joinedAt)) {
        //nothing to claim
        return;
      }

      let deposited = new BigNumber(props.participant.amount);
      let rewardsToClaim = deposited.multipliedBy(distr.minus(joinedAt)).decimalPlaces(0);
      setClaimable(rewardsToClaim);
    }
  }, [props]);

  if (prizeToken === undefined || stakingToken === undefined) {
    return <></>
  }

  return (
    <StakingRewardDetailsBox prizeToken={prizeToken} stakingToken={stakingToken} reward={props.reward}>
      <Divider mt='$6' mb='$6'/>
      <StakingRewardDetailsBoxRow props={{name: 'Your stake:', value: `${prettyAmount(uAmountToAmount(props.participant?.amount ?? 0, stakingDisplayDenom?.exponent ?? 0))} ${stakingDisplayDenom?.denom}`}} />
      <StakingRewardDetailsBoxRow props={{name: 'Pending rewards', value: `${prettyAmount(uAmountToAmount(claimable.toString(), prizeDisplayDenom?.exponent ?? 0))} ${prizeDisplayDenom?.denom}`}}/>
      <Box mt={'$6'} display={'flex'} flexDirection={'column'}>
        {!confirmUnstake && !showForm &&
        <Box display='flex' flexDirection={'row'} justifyContent={'space-around'}>
          <Button size='sm' intent="primary" onClick={() => {setConfirmUnstake(true)}} disabled={submitPending}>Unstake</Button>
          <Button size='sm' intent="primary" onClick={() => {setShowForm(true)}} disabled={submitPending || props.reward.payouts >= props.reward.duration}>Stake</Button>
          <Button size='sm' intent="primary" onClick={() => {claim()}} isLoading={submitPending}>Claim</Button>
        </Box>
        }
        {confirmUnstake &&
          <Box>
            {props.reward.lock > 0 &&
              <Box display={'flex'} flex={1} textAlign={"center"} justifyContent={'center'}>
                <Callout
                  attributes={{
                    maxWidth: '350px',
                    marginTop: '$6'
                  }}
                  iconName="errorWarningLine"
                  intent="warning"
                  title="Warning"
                >
                  Your funds will be locked for {props.reward.lock} days. During this period you will not gain rewards and the funds will not be visible in our wallet.
                </Callout>
              </Box>
            }
            <Box mt='$6' display='flex' flexDirection={'row'} justifyContent={'space-around'}>
              <Button size='sm' intent="secondary" onClick={cancelUnstake} disabled={submitPending}>Cancel</Button>
              <Button size='sm' intent="primary" onClick={unstake} isLoading={submitPending} >Unstake</Button>
            </Box>
          </Box>  
        }
        {showForm &&
        <Box mt={'$6'}>
          <TextField
            size='sm'
            id="stake_amount"
            label={"Stake " + stakingToken.metadata.display}
            onChange={(e) => {setAmount(sanitizeNumberInput(e.target.value))}}
            placeholder="Amount"
            value={amount ?? ""}
            type="text"
            inputMode="numeric"
            disabled={submitPending}
          />
          <Box mt='$6' display='flex' flexDirection={'row'} justifyContent={'space-around'}>
            <Button size='sm' intent="secondary" onClick={cancelForm} disabled={submitPending}>Cancel</Button>
            <Button size='sm' intent="primary" onClick={submitStake} isLoading={submitPending}>Stake</Button>
          </Box>
        </Box>  
      }
      </Box>
    </StakingRewardDetailsBox>
  );
}

export function MyRewards() {
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<StakingRewardSDKType[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<StakingRewardSDKType[]>([]);
  const [allAssets, setAllAssets] = useState<Map<string, Token>>(new Map());
  const [stakingParticipations, setStakingParticipations] = useState<Map<string, StakingRewardParticipantSDKType>>(new Map());

  const { address } = useChain(getChainName());

  const fetchStakingRewards = async () => {
    if (address === undefined) {
      return;
    }

    const addrRew = await getAddressStakingRewards(address);
    setRewards(addrRew.rewards);
    setFilteredRewards(addrRew.rewards);
    setStakingParticipations(addrRew.participation);
  }
  
  const fetchTokens = async () => {
    const all = await getAllSupplyTokens();
    setAllAssets(all);
  }

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
  }, [address]);

  return (
    <Box>
      <DefaultBorderedBox p='$6' m='$6'>
        <Box display={'flex'} flex={1} flexDirection={'row'} alignItems={'center'}>
          <Box display={'flex'} justifyContent={{desktop: 'flex-end', mobile: 'center'}} flex={1}>
            <SearchInput placeholder='Search by asset' width={20} onSubmit={onSearchSubmit}/>
          </Box>
        </Box>
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
          (
            address ?
            (filteredRewards.length > 0 ?
              filteredRewards.map((rew, index) => (
                <MyRewardDetail props={{reward: rew, tokens: allAssets, participant: stakingParticipations.get(rew.reward_id), refreshList: forceListRefresh}} key={index}/>
              )) 
              :
              <Box p='$6' m='$6' textAlign={'center'} display={'flex'} flex={1} justifyContent={'center'}><Text>No rewards found...</Text></Box>
            )
            :
            <Box p='$6' m='$6' textAlign={'center'} display={'flex'} flex={1} justifyContent={'center'}>
              <WalletConnectCallout props={{text: 'Please connect your wallet to view your rewards'}}/>
            </Box>
          )
        } 
      </Box>
    </Box>
  );
}
