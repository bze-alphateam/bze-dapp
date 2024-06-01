
import { Prices } from "@/hooks/usePrices";
import { Token } from "@/services";
import { StakingRewardSDKType } from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward";
import { useMemo } from "react";
import { DefaultBorderedBox } from "./Box";
import { Box,Icon, Text } from "@interchain-ui/react";
import { DenomUnitSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import BigNumber from "bignumber.js";
import { prettyAmount, uAmountToAmount } from "@/utils";

export interface StakingRewardDetailsBoxRowProps {
  name: string,
  value: string,
}

export function StakingRewardDetailsBoxRow({props}: {props: StakingRewardDetailsBoxRowProps}) {
  return (
    <Box display={'flex'} flex={1} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} mt={'$6'} flexWrap={'wrap'}>
      <Box>
        <Text fontWeight={'$semibold'} fontSize={'$sm'}>{props.name}</Text>
      </Box>
      <Box>
        <Text fontWeight={'$bold'} fontSize={'$sm'} color={'$primary100'}>{props.value}</Text>
      </Box>
    </Box>
  );
}

export interface StakingRewardDetailMemoData {
  apr: string;
  dailyRewards: string;
  lock: string;
  remainingPeriod: string;
  totalStaked: string;
  minStaking: string;
}

export interface StakingRewardDetailsBoxProps {
  children: React.ReactNode;
  reward: StakingRewardSDKType;
  stakingToken: Token|undefined;
  prizeToken: Token|undefined;
}

export function StakingRewardDetailsBox({children, ...props}: StakingRewardDetailsBoxProps) {
  const { apr, dailyRewards, lock, remainingPeriod, totalStaked, minStaking } = useMemo((): StakingRewardDetailMemoData => {
    const pToken = props.prizeToken;
    const sToken = props.stakingToken;
    let result = {prizeToken: pToken, stakingToken: sToken, apr: "", dailyRewards: "", lock: "", remainingPeriod: "", totalStaked: "", minStaking: ""}
    if (pToken === undefined || sToken === undefined) {
      return result;
    }

    let staked =  new BigNumber(props.reward.staked_amount);
    result.apr = "?";
    if (pToken.metadata.base === sToken.metadata.base && staked.gt(0)) {
      let computedApr = new BigNumber(props.reward.prize_amount).dividedBy(staked).multipliedBy(365).multipliedBy(100);
      result.apr = `~${computedApr.toString()}%`;
    }

    const pDisplay = pToken.metadata.denom_units.find((denom: DenomUnitSDKType) => denom.denom === pToken.metadata.display);
    if (pDisplay === undefined) {
      return result;
    }
    result.dailyRewards = `${prettyAmount(uAmountToAmount(props.reward.prize_amount, pDisplay.exponent))} ${pDisplay.denom}`;
    result.lock = `${props.reward.lock} days`

    const remaining = new BigNumber(props.reward.duration).minus(props.reward.payouts).toString();
    result.remainingPeriod = `${remaining} days`

    const sDisplay = sToken.metadata.denom_units.find((denom: DenomUnitSDKType) => denom.denom === sToken.metadata.display);
    if (sDisplay === undefined) {
      return result;
    }
    result.totalStaked = `${prettyAmount(uAmountToAmount(props.reward.staked_amount, sDisplay.exponent))} ${sDisplay.denom}`;
    result.minStaking = `${prettyAmount(uAmountToAmount(props.reward.min_stake.toString(), sDisplay.exponent))} ${sDisplay.denom}`;

    return result;
  }, [props]);

  if (props.stakingToken === undefined || props.prizeToken === undefined) {
    return <></>
  }

  return (
    <DefaultBorderedBox m='$6' p='$6' flexDirection={'column'}>
      <Box display={'flex'} flex={1} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} minWidth={{desktop: '350px', mobile: '200px'}}>
        <Box
          as="img"
          attributes={{
            src: props.stakingToken.logo,
          }}
          width={"$16"}
          height={"$16"}
        />
        <Box>
          <Text fontWeight={'$hairline'} fontSize={'$sm'} color={'$primary100'}>Stake</Text>
          <Text fontWeight={'$bold'} fontSize={'$lg'} color={'$primary200'}>{props.stakingToken.metadata.display}</Text>
        </Box>
        <Box>
          <Icon name="arrowRightLine" size={'$2xl'} color={'$primary200'} />
        </Box>
        <Box
          as="img"
          attributes={{
            src: props.prizeToken.logo,
          }}
          width={"$16"}
          height={"$16"}
        />
        <Box>
          <Text fontWeight={'$hairline'} fontSize={'$sm'} color={'$primary100'}>Earn</Text>
          <Text fontWeight={'$bold'} fontSize={'$lg'} color={'$primary200'}>{props.prizeToken.metadata.display}</Text>
        </Box>
      </Box>
      {apr !== "" ? <StakingRewardDetailsBoxRow props={{name: 'APR:', value: apr}} /> : null}
      <StakingRewardDetailsBoxRow props={{name: 'Reward:', value: props.prizeToken.metadata.display}} />
      <StakingRewardDetailsBoxRow props={{name: 'Daily distribution:', value: dailyRewards}} />
      <StakingRewardDetailsBoxRow props={{name: 'Min stake:', value: minStaking}} />
      <StakingRewardDetailsBoxRow props={{name: 'Lock:', value: lock}} />
      <StakingRewardDetailsBoxRow props={{name: 'Remaining:', value: remainingPeriod}} />
      <StakingRewardDetailsBoxRow props={{name: 'Staked:', value: totalStaked}} />
      <StakingRewardDetailsBoxRow props={{name: 'Verified:', value: props.prizeToken.verified && props.stakingToken.verified ? '✅ YES' : '❌ NO'}} />
      {children}
    </DefaultBorderedBox>
  );
}
