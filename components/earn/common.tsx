import {DenomUnitSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import BigNumber from "bignumber.js";
import {amountToUAmount, calculateApr, isGreaterThan, isGreaterThanZero, uAmountToAmount} from "@/utils";
import {StakingRewardSDKType} from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward";
import {Token} from "@/services";
import {CoinSDKType} from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";
import {bze} from "@bze/bzejs";

interface AmountChangeHandlerProps {
    reward: StakingRewardSDKType;
}

export const amountChangeHandler = (amount: string, props: AmountChangeHandlerProps, amountSetter: (amount: string|undefined) => void, aprSetter: (apr: BigNumber|undefined) => void, prizeToken?: Token|undefined) => {
    amountSetter(amount);

    const shouldEstimateApr = (props.reward.prize_denom && props.reward.prize_denom === props.reward.staking_denom);
    if (!shouldEstimateApr || !prizeToken) {
        return;
    }

    const pDisplay = prizeToken.metadata.denom_units.find((denom: DenomUnitSDKType) => denom.denom === prizeToken.metadata.display);
    if (!pDisplay) {
        return;
    }

    const amountNum = new BigNumber(amountToUAmount(amount, pDisplay.exponent));
    if (!amountNum.gt(0)) {
        aprSetter(undefined);
        return;
    }

    const staked = new BigNumber(props.reward.staked_amount);
    const apr = calculateApr(props.reward.prize_amount, staked.plus(amountNum));

    aprSetter(apr);
}

interface GetStakingTokenBalanceProps {
    balances?: CoinSDKType[];
}


export const getStakingTokenBalance = (props: GetStakingTokenBalanceProps, stakingDisplayDenom?: DenomUnitSDKType|undefined, stakingToken?: Token|undefined) => {
    if (!props.balances || props.balances.length === 0 || !stakingDisplayDenom) {
        return "0";
    }

    const bal = props.balances.find((item) => item.denom === stakingToken?.metadata.base);
    if (!bal) {
        return "0";
    }

    return uAmountToAmount(bal.amount, stakingDisplayDenom.exponent);
}



export const getStakingAmountErrors = (amount: string, stakingTokenBalance: string) => {
    if (isGreaterThan(amount, stakingTokenBalance)) {
        return 'Your balance is lower than the provided input';
    }

    if (!isGreaterThanZero(amount)) {
        return 'Please insert positive amount';
    }

    return undefined;
}

const {joinStaking} = bze.v1.rewards.MessageComposer.withTypeUrl;

export const createStakingMessage = (amount: string, stakingDisplayDenom: DenomUnitSDKType, rewardId: string, address?: string|undefined) => {
    const convertedAmount = amountToUAmount(amount, stakingDisplayDenom.exponent);
    return joinStaking({
        amount: convertedAmount,
        creator: address ?? "",
        rewardId: rewardId,
    });
}