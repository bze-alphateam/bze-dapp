import {Box, Button, Callout, Divider, Text, TextField} from "@interchain-ui/react";
import {
    DefaultBorderedBox,
    StakingRewardDetailProps,
    StakingRewardDetailsBox,
    StakingRewardDetailsBoxRow
} from "@/components";
import {useEffect, useState} from "react";
import {StakingRewardSDKType} from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward";
import {getAllSupplyTokens, getHourEpochInfo, Token} from "@/services";
import {SearchInput} from "@/components/common/Input";
import {useToast, useTx} from "@/hooks";
import {
    amountToUAmount,
    calculateApr,
    getChainName,
    isGreaterThanZero,
    prettyAmount,
    sanitizeNumberInput,
    uAmountToAmount
} from "@/utils";
import BigNumber from "bignumber.js";
import {bze} from '@bze/bzejs';
import {useChain} from "@cosmos-kit/react";
import {getAddressStakingRewards, resetStakingRewardsCache} from "@/services/data_provider/StakingReward";
import {DenomUnitSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import WalletConnectCallout from "@/components/wallet/WalletCallout";
import {StakingRewardParticipantSDKType} from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward_participant";
import {PendingUnlockParticipantSDKType} from "@bze/bzejs/src/codegen/beezee/rewards/staking_reward_participant";
import Long from 'long';

const {joinStaking, exitStaking, claimStakingRewards} = bze.v1.rewards.MessageComposer.withTypeUrl;

interface MyRewardDetailProps extends StakingRewardDetailProps {
    participant?: StakingRewardParticipantSDKType;
}

function MyRewardDetail({props}: { props: MyRewardDetailProps }) {
    const [confirmUnstake, setConfirmUnstake] = useState(false);
    const [submitPending, setSubmitPending] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [stakingToken, setStakingToken] = useState<Token>();
    const [prizeToken, setPrizeToken] = useState<Token>();
    const [stakingDisplayDenom, setStakingDisplayDenom] = useState<DenomUnitSDKType>();
    const [prizeDisplayDenom, setPrizeDisplayDenom] = useState<DenomUnitSDKType>();
    const [claimable, setClaimable] = useState(new BigNumber(0));
    const [amount, setAmount] = useState<string>("");

    const [shouldEstimateApr, setShouldEstimateApr] = useState(false);
    const [estimatedApr, setEstimatedApr] = useState<BigNumber | undefined>();

    const {tx} = useTx();
    const {address} = useChain(getChainName());
    const {toast} = useToast();

    const onAmountChange = (amount: string) => {
        setAmount(amount);
        if (!shouldEstimateApr || !prizeToken) {
            return;
        }

        const pDisplay = prizeToken.metadata.denom_units.find((denom: DenomUnitSDKType) => denom.denom === prizeToken.metadata.display);
        if (!pDisplay) {
            return;
        }

        const amountNum = new BigNumber(amountToUAmount(amount, pDisplay.exponent));
        if (!amountNum.gt(0)) {
            setEstimatedApr(undefined);
            return;
        }

        const staked = new BigNumber(props.reward.staked_amount);
        const apr = calculateApr(props.reward.prize_amount, staked.plus(amountNum));

        setEstimatedApr(apr);
    }

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

        setShouldEstimateApr(props.reward.prize_denom === props.reward.staking_denom);
    }, [props]);

    if (prizeToken === undefined || stakingToken === undefined) {
        return <></>
    }

    return (
        <StakingRewardDetailsBox prizeToken={prizeToken} stakingToken={stakingToken} reward={props.reward}>
            <Divider mt='$6' mb='$6'/>
            <StakingRewardDetailsBoxRow props={{
                name: 'Your stake:',
                value: `${prettyAmount(uAmountToAmount(props.participant?.amount ?? 0, stakingDisplayDenom?.exponent ?? 0))} ${stakingDisplayDenom?.denom.toUpperCase()}`
            }}/>
            <StakingRewardDetailsBoxRow props={{
                name: 'Pending rewards',
                value: `${prettyAmount(uAmountToAmount(claimable.toString(), prizeDisplayDenom?.exponent ?? 0))} ${prizeDisplayDenom?.denom.toUpperCase()}`
            }}/>
            <Box mt={'$6'} display={'flex'} flexDirection={'column'}>
                {!confirmUnstake && !showForm &&
                    <Box display='flex' flexDirection={'row'} justifyContent={'space-around'}>
                        <Button size='sm' intent="primary" onClick={() => {
                            setConfirmUnstake(true)
                        }} disabled={submitPending}>Unstake</Button>
                        <Button size='sm' intent="primary" onClick={() => {
                            setShowForm(true)
                        }} disabled={submitPending || props.reward.payouts >= props.reward.duration}>Stake</Button>
                        <Button size='sm' intent="primary" onClick={() => {
                            claim()
                        }} isLoading={submitPending}>Claim</Button>
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
                                    Your funds will be locked for {props.reward.lock} days. During this period you will
                                    not gain rewards and the funds will not be visible in our wallet.
                                </Callout>
                            </Box>
                        }
                        <Box mt='$6' display='flex' flexDirection={'row'} justifyContent={'space-around'}>
                            <Button size='sm' intent="secondary" onClick={cancelUnstake}
                                    disabled={submitPending}>Cancel</Button>
                            <Button size='sm' intent="primary" onClick={unstake}
                                    isLoading={submitPending}>Unstake</Button>
                        </Box>
                    </Box>
                }
                {showForm &&
                    <Box mt={'$6'}>
                        <TextField
                            size='sm'
                            id="stake_amount"
                            label={"Stake " + stakingToken.metadata.display}
                            onChange={(e) => {
                                onAmountChange(sanitizeNumberInput(e.target.value))
                            }}
                            placeholder="Amount"
                            value={amount ?? ""}
                            type="text"
                            inputMode="numeric"
                            disabled={submitPending}
                        />
                        {estimatedApr &&
                            <Text fontWeight={'$hairline'} fontSize={'$xs'} textAlign={'center'} color={'$textWarning'}>Expected
                                ARP ~{estimatedApr.toString()}%</Text>}
                        <Box mt='$6' display='flex' flexDirection={'row'} justifyContent={'space-around'}>
                            <Button size='sm' intent="secondary" onClick={cancelForm}
                                    disabled={submitPending}>Cancel</Button>
                            <Button size='sm' intent="primary" onClick={submitStake}
                                    isLoading={submitPending}>Stake</Button>
                        </Box>
                    </Box>
                }
            </Box>
        </StakingRewardDetailsBox>
    );
}

interface PendingUnlockBoxProps {
    pending: PendingUnlockParticipantSDKType;
    token?: Token|undefined;
    currentEpoch: number;
}

function PendingUnlockBox({props}: {props: PendingUnlockBoxProps}) {
    const {pending, token, currentEpoch} = props;

    if (!token) {
        return null;
    }

    const displayDenom = token.metadata.denom_units.find((unit) => unit.denom === token.metadata.display);
    if (!displayDenom) {
        return null;
    }

    const getPendingEndEpoch = () => {
        const split = pending.index.split("/")
        if (split.length === 0) {
            return 0;
        }

        const parsed = parseInt(split[0], 10)
        if (!parsed) {
            return 0;
        }

        return parsed;
    }

    const getRemainingHours = () => {
        const pendingEpoch = getPendingEndEpoch();

        return pendingEpoch - currentEpoch;
    }

    const getRemainingText = () => {
        const remainingHours = getRemainingHours();
        const days = Math.floor(remainingHours / 24);
        if (days >= 2) {
            return `Unlocking in ${days} days`;
        }

        if (remainingHours > 1) {
            return `Unlocking in ${remainingHours} hours`;
        }

        return `Unlocking in 1 hour`;
    }

    return (
        <DefaultBorderedBox m='$6' p='$6'>
            <Text fontSize={"$md"} color={"$primary300"} fontWeight={"$semibold"}>{prettyAmount(uAmountToAmount(pending.amount, displayDenom.exponent))} {token?.metadata.display.toUpperCase()}</Text>
            <Text fontSize={"$xs"} fontWeight={"$hairline"}>{getRemainingText()}</Text>
        </DefaultBorderedBox>
    );
}

export function MyRewards() {
    const [loading, setLoading] = useState(true);
    const [rewards, setRewards] = useState<StakingRewardSDKType[]>([]);
    const [filteredRewards, setFilteredRewards] = useState<StakingRewardSDKType[]>([]);
    const [allAssets, setAllAssets] = useState<Map<string, Token>>(new Map());
    const [stakingParticipations, setStakingParticipations] = useState<Map<string, StakingRewardParticipantSDKType>>(new Map());
    const [unlocking, setUnlocking] = useState<PendingUnlockParticipantSDKType[]>([]);
    const [currentEpoch, setCurrentEpoch] = useState(0);

    const {address} = useChain(getChainName());

    const fetchStakingRewards = async () => {
        if (address === undefined) {
            return;
        }

        const addrRew = await getAddressStakingRewards(address);
        setRewards(addrRew.rewards);
        setFilteredRewards(addrRew.rewards);
        setStakingParticipations(addrRew.participation);
        setUnlocking(addrRew.unlocking);
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

    const fetchEpoch = async () => {
        const info = await getHourEpochInfo();
        if (!info) {
            return;
        }

        setCurrentEpoch(Long.fromValue(info.current_epoch).toNumber());
    }

    const initialLoad = async () => {
        setLoading(true);
        await Promise.all([
            fetchStakingRewards(),
            fetchTokens(),
            fetchEpoch(),
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
                    <Box p='$6' m='$6' textAlign={'center'} display={'flex'} flex={1} justifyContent={'center'}><Text>Loading
                        ...</Text></Box>
                    :
                    (
                        !address ?
                            <Box p='$6' m='$6' textAlign={'center'} display={'flex'} flex={1} justifyContent={'center'}>
                                <WalletConnectCallout
                                    props={{text: 'Please connect your wallet to view your rewards'}}/>
                            </Box>
                            :
                            <>
                                {filteredRewards.length > 0 ?
                                    filteredRewards.map((rew, index) => (
                                        <MyRewardDetail props={{
                                            reward: rew,
                                            tokens: allAssets,
                                            participant: stakingParticipations.get(rew.reward_id),
                                            refreshList: forceListRefresh
                                        }} key={index}/>
                                    ))
                                    :
                                    <Box p='$6' m='$6' textAlign={'center'} display={'flex'} flex={1}
                                         justifyContent={'center'}><Text>No rewards found...</Text></Box>
                                }
                            </>
                    )
                }
            </Box>

            {!loading && address && unlocking.length > 0 &&
                <Box p='$6' m='$6' textAlign={'center'} display={'flex'} flex={1} justifyContent={'center'}>
                    {
                        unlocking.map((u, index) => (
                            <PendingUnlockBox key={u.index} props={{pending: u, token: allAssets.get(u.denom), currentEpoch: currentEpoch}} />
                        ))
                    }
                </Box>
            }
        </Box>
    );
}
