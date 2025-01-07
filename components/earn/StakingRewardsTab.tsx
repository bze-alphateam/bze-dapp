import {Box, Button, Callout, FieldLabel, Text, TextField} from "@interchain-ui/react";
import {ClickableBox, DefaultBorderedBox, StakingRewardDetailsBox} from "@/components";
import {useEffect, useState} from "react";
import {StakingRewardSDKType} from "@bze/bzejs/types/codegen/beezee/rewards/staking_reward";
import {getAllSupplyTokens, getRewardsParams, getTokenDisplayDenom, Token} from "@/services";
import {SearchInput} from "@/components/common/Input";
import SelectAssetModal from "@/components/wallet/SelectAssetModal";
import {useDisclosure, useToast, useTx} from "@/hooks";
import {
    amountToUAmount,
    calculateApr,
    getChainName,
    isGreaterOrEqualToZero, isGreaterThan,
    isGreaterThanZero,
    prettyAmount,
    prettyFee, sanitizeIntegerInput,
    sanitizeNumberInput, uAmountToAmount
} from "@/utils";
import BigNumber from "bignumber.js";
import {DeliverTxResponse} from "@cosmjs/stargate";
import {bze} from '@bze/bzejs';
import {useChain} from "@cosmos-kit/react";
import {getStakingRewards, resetStakingRewardsCache} from "@/services/data_provider/StakingReward";
import {DenomUnitSDKType} from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import {CoinSDKType} from "@bze/bzejs/types/codegen/cosmos/base/v1beta1/coin";
import {getAddressBalances, removeBalancesCache} from "@/services/data_provider/Balances";
import {
    amountChangeHandler,
    createStakingMessage,
    getStakingAmountErrors,
    getStakingTokenBalance
} from "@/components/earn/common";

const {createStakingReward, updateStakingReward} = bze.v1.rewards.MessageComposer.withTypeUrl;

export interface StakingRewardDetailProps {
    reward: StakingRewardSDKType;
    tokens: Map<string, Token>;
    refreshList?: () => void;
    balances?: CoinSDKType[];
}

function StakingRewardDetail({props}: { props: StakingRewardDetailProps }) {
    const [showForm, setShowForm] = useState(false);
    const [showDonateForm, setShowDonateForm] = useState(false);
    const [amount, setAmount] = useState<string | undefined>();
    const [extendInput, setExtendInput] = useState<string | undefined>();
    const [submitPending, setSubmitPending] = useState(false);

    const [estimatedApr, setEstimatedApr] = useState<BigNumber | undefined>();

    const [stakingToken, setStakingToken] = useState<Token>();
    const [stakingDisplayDenom, setStakingDisplayDenom] = useState<DenomUnitSDKType>();
    const [prizeDisplayDenom, setPrizeDisplayDenom] = useState<DenomUnitSDKType>();
    const [prizeToken, setPrizeToken] = useState<Token>();

    const {toast} = useToast();
    const {tx} = useTx();
    const {address} = useChain(getChainName());

    const onExtendInputChange = (days: string) => {
        setExtendInput(days);
    }

    const onAmountChange = (amount: string) => {
        amountChangeHandler(amount, props, setAmount, setEstimatedApr, prizeToken);
    }

    const cancelForm = () => {
        setShowForm(false);
        setAmount(undefined);
    }

    const submitStake = async () => {
        if (stakingToken === undefined || amount === undefined || stakingDisplayDenom === undefined) {
            return;
        }

        setSubmitPending(true);
        const amountErr = getStakingAmountErrors(amount, getStakingTokenBalance(props, stakingDisplayDenom, stakingToken));
        if (amountErr) {
            toast({
                title: 'Invalid amount',
                description: amountErr,
                type: 'error'
            });

            setSubmitPending(false);

            return;
        }

        const msg = createStakingMessage(amount, stakingDisplayDenom, props.reward.reward_id, address);

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

    const submitExtendDonation = async () => {
        if (stakingToken === undefined || extendInput === undefined || stakingDisplayDenom === undefined) {
            return;
        }

        setSubmitPending(true);
        const parsedDays = parseInt(extendInput, 10);
        if (parsedDays < 1 || parsedDays > 3650) {
            toast({
                title: 'Invalid input',
                description: "Number of days must be between 0 and 3651",
                type: 'error'
            });

            setSubmitPending(false);

            return;
        }

        const msg = updateStakingReward({
            creator: address ?? "",
            rewardId: props.reward.reward_id,
            duration: extendInput,
        });

        await tx([msg], {
            toast: {
                description: 'Staking reward successfully extended',
            },
            onSuccess: () => {
                props.refreshList ? props.refreshList() : null;
                setShowDonateForm(false);
            }
        });

        setSubmitPending(false);
    };

    const stakingTokenBalance = () => {
        if (!address) {
            return "0";
        }

        return getStakingTokenBalance(props, stakingDisplayDenom, stakingToken);
    }

    const getDonateButtonText = () => {
        if (!extendInput || !prizeDisplayDenom) {
            return "Donate";
        }

        const intDays = parseInt(extendInput);
        if (intDays < 1) {
            return "Donate";
        }

        const totalAmount = new BigNumber(extendInput).multipliedBy(props.reward.prize_amount);

        return `Donate ${prettyAmount(uAmountToAmount(totalAmount.toNumber(), prizeDisplayDenom.exponent))} ${prizeDisplayDenom.denom.toUpperCase()}`;
    }

    useEffect(() => {
        let pToken = props.tokens.get(props.reward.prize_denom);
        setPrizeToken(pToken);
        if (pToken) {
            setPrizeDisplayDenom(pToken.metadata.denom_units.find((denom: DenomUnitSDKType) => denom.denom === pToken?.metadata.display));
        }
        let sToken = props.tokens.get(props.reward.staking_denom);
        setStakingToken(sToken);
        if (sToken) {
            setStakingDisplayDenom(sToken.metadata.denom_units.find((denom: DenomUnitSDKType) => denom.denom === sToken?.metadata.display));
        }

    }, [props]);

    if (prizeToken === undefined || stakingToken === undefined || !prizeDisplayDenom || !stakingDisplayDenom) {
        return <></>
    }

    return (
        <StakingRewardDetailsBox prizeToken={prizeToken} stakingToken={stakingToken} reward={props.reward}>
            {!showForm && !showDonateForm &&
                <Box display={'flex'} flex={1} flexDirection={'row'} justifyContent={'space-around'}
                     mt={'$6'} flexWrap={'wrap'}>
                    <Button size='sm' intent="primary" onClick={() => {
                        setShowForm(true)
                    }} disabled={props.reward.payouts >= props.reward.duration}>Stake</Button>
                    <Button size='sm' intent="primary" onClick={() => {
                        setShowDonateForm(true)
                    }} disabled={props.reward.payouts >= props.reward.duration}>Donate</Button>
                </Box>
            }
            {
                showForm &&
                <Box mt={'$6'} justifyContent={'center'}>
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
                        //@ts-ignore
                        inputMode="decimal"
                        disabled={submitPending}
                    />
                    <Box p={"$2"} display={'flex'} flex={1} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'} flexWrap={'wrap'}>
                        <Box>
                            <Text fontWeight={'$hairline'} fontSize={'$xs'}>Available</Text>
                        </Box>
                        <ClickableBox onClick={() => onAmountChange(stakingTokenBalance())}>
                            <Box>
                                <Text fontWeight={'$hairline'} fontSize={'$xs'} color={'$primary100'}>{stakingTokenBalance()} {stakingToken.metadata.symbol.toUpperCase()}</Text>
                            </Box>
                        </ClickableBox>
                    </Box>
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
            {showDonateForm &&
                <Box>
                    {props.reward.lock > 0 &&
                        <Box display={'flex'} flex={1} textAlign={"center"} justifyContent={'center'} flexDirection={"column"}>
                            <Callout
                                attributes={{
                                    maxWidth: '350px',
                                    marginTop: '$6'
                                }}
                                iconName="informationLine"
                                intent="info"
                                title="Donate & Contribute"
                            >
                                You can donate {prizeDisplayDenom.denom.toUpperCase()} to extend the duration of this staking reward by a number of days, showing your support for the participating stakers.
                            </Callout>
                            <TextField
                                size='sm'
                                id="stake_extend"
                                label={"Days"}
                                onChange={(e) => {
                                    onExtendInputChange(sanitizeIntegerInput(e.target.value))
                                }}
                                placeholder="Days to extend"
                                value={extendInput ?? ""}
                                type="text"
                                inputMode="numeric"
                                disabled={submitPending}
                            />
                            <Callout
                                attributes={{
                                    maxWidth: '350px',
                                    marginTop: '$6'
                                }}
                                iconName="errorWarningFill"
                                intent="error"
                                title="Attention"
                            >
                                YOU WILL PAY {prettyAmount(uAmountToAmount(props.reward.prize_amount, prizeDisplayDenom.exponent))} {prizeDisplayDenom.denom.toUpperCase()} for each day. <br/><br/>
                                This action can NOT be undone!
                            </Callout>
                        </Box>
                    }
                    <Box mt='$6' display='flex' flexDirection={'row'} justifyContent={'space-around'}>
                        <Button size='sm' intent="secondary" onClick={() => {setShowDonateForm(false)}}
                                disabled={submitPending}>Cancel</Button>
                        <Button size='sm' intent="primary" onClick={submitExtendDonation}
                                isLoading={submitPending}>{getDonateButtonText()}</Button>
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

function AddStakingRewardForm({props}: { props: AddStakingRewardFormProps }) {
    //this state
    const [allTokens, setAllTokens] = useState<Token[]>([]);
    const [createFee, setCreateFee] = useState<string>("");

    //form state
    const [prizeAmount, setPrizeAmount] = useState<string>("");
    const [selectedPrizeDenom, setSelectedPrizeDenom] = useState<Token | undefined>();
    const [duration, setDuration] = useState<string | undefined>();
    const [selectedStakingDenom, setSelectedStakingDenom] = useState<Token | undefined>();
    const [minStake, setMinStake] = useState<string | undefined>();
    const [lock, setLock] = useState<string | undefined>();
    const [validForm, setValidForm] = useState(false);
    const [submitPending, setSubmitPending] = useState(false);

    //modals state
    const prizeDenomDisclosure = useDisclosure();
    const stakingDenomDisclosure = useDisclosure();

    const {toast} = useToast();
    const {tx} = useTx();
    const {address} = useChain(getChainName());

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
            duration: duration,
            lock: lock,
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

        return `${prize.toString()} ${selectedPrizeDenom?.metadata.display.toUpperCase()}`;
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
            <SelectAssetModal
                props={{control: stakingDenomDisclosure, onClick: onStakingDenomSelect, list: allTokens}}/>
            <DefaultBorderedBox p='$6' mt='$6'>
                <Box display={'flex'} flexDirection={'row'} alignItems={'end'} gap={'$6'} flexWrap={'wrap'}
                     justifyContent={'center'}>
                    <Box>
                        <TextField
                            size='sm'
                            id="prize_amount"
                            label="Daily reward"
                            onChange={(e) => {
                                setPrizeAmount(sanitizeNumberInput(e.target.value))
                            }}
                            placeholder="Amount"
                            value={prizeAmount ?? ""}
                            type="text"
                            //@ts-ignore
                            inputMode="decimal"
                            disabled={validForm}
                        />
                    </Box>
                    <Box p='$2'>
                        <FieldLabel htmlFor="pick-denom-1" label={"Reward coin"}
                                    attributes={{marginBottom: '12px'}}></FieldLabel>
                        <Button intent="text" key={"pick-denom-1"} disabled={validForm} size='sm'
                                leftIcon={selectedPrizeDenom === undefined ? "add" : undefined}
                                onClick={prizeDenomDisclosure.onOpen}>{selectedPrizeDenom === undefined ? "Pick coin" : selectedPrizeDenom.metadata.name}</Button>
                    </Box>
                    <Box>
                        <TextField
                            size='sm'
                            id="duration"
                            label="Reward duration"
                            onChange={(e) => {
                                setDuration(sanitizeIntegerInput(e.target.value))
                            }}
                            placeholder="No. of days"
                            value={duration ? `${duration}` : ""}
                            type="text"
                            inputMode="numeric"
                            disabled={validForm}
                        />
                    </Box>
                    <Box p='$2'>
                        <FieldLabel htmlFor="pick-denom-2" label={"Staking coin"}
                                    attributes={{marginBottom: '12px'}}></FieldLabel>
                        <Button intent="text" key={"pick-denom-2"} disabled={validForm} size='sm'
                                leftIcon={selectedStakingDenom === undefined ? "add" : undefined}
                                onClick={stakingDenomDisclosure.onOpen}>{selectedStakingDenom === undefined ? "Pick coin" : selectedStakingDenom.metadata.name}</Button>
                    </Box>
                    <Box>
                        <TextField
                            size='sm'
                            id="min_stake"
                            label="Min stake"
                            onChange={(e) => {
                                setMinStake(sanitizeNumberInput(e.target.value))
                            }}
                            placeholder="Min stake amount"
                            value={minStake ? `${minStake}` : ""}
                            type="text"
                            //@ts-ignore
                            inputMode="decimal"
                            disabled={validForm}
                        />
                    </Box>
                    <Box>
                        <TextField
                            size='sm'
                            id="lock"
                            label="Unstake lock"
                            onChange={(e) => {
                                setLock(sanitizeIntegerInput(e.target.value))
                            }}
                            placeholder="No. of days"
                            value={lock ? `${lock}` : ""}
                            type="text"
                            inputMode="numeric"
                            disabled={validForm}
                        />
                    </Box>
                </Box>
                <Box p='$6' mt='$12' display={'flex'} flexDirection={'row'} alignItems={'center'}
                     justifyContent={'center'} gap={'$6'} flexWrap={'wrap'}>
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
                                    You are creating a staking reward that will
                                    distribute {prettyAmount(prizeAmount)} {selectedPrizeDenom?.metadata.display.toUpperCase()} every
                                    day, for a period of {duration} days, to all the users that
                                    stake {minStake !== undefined ? prettyAmount(minStake) : 0} {selectedStakingDenom?.metadata.display.toUpperCase()} or
                                    more. The staked amounts will be locked for {lock ?? 0} days.
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
                                    THIS ACTION IS CREATING A NEW STAKING REWARD! IF YOU CAME HERE JUST TO EARN SOME
                                    COINS FIND A SUITABLE STAKING REWARD BELOW AND STAKE YOUR COINS IN IT.
                                    THIS FORM IS NOT FOR YOU!<br/><br/>

                                    You will pay {createFee} fee for creating the staking reward
                                    and {calculateAmountToPay()} will be captured from your wallet by the blockchain in
                                    order to pay for the rewards. This action can NOT be undone and the staking reward
                                    can NOT be edited or refunded.
                                </Callout>
                            </Box>
                            <Button intent="secondary" size='sm' onClick={() => {
                                setValidForm(false)
                            }} disabled={submitPending}>Cancel</Button>
                            <Button intent="primary" size='sm' onClick={() => {
                                submitTransaction()
                            }} isLoading={submitPending}>Confirm</Button>
                        </>
                        :
                        <>
                            <Button intent="secondary" key={"cancel-reward"} size='sm'
                                    onClick={props.onCancel}>Cancel</Button>
                            <Button intent="primary" key={"create-reward"} size='sm' onClick={onFormSubmit}>Create
                                reward</Button>
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
    const [balances, setBalances] = useState<CoinSDKType[]>([]);

    const {address} = useChain(getChainName());

    const fetchStakingRewards = async () => {
        const all = await getStakingRewards();
        const sorted = all.list.sort((a, b) => a.payouts >= a.duration ? 1 : -1);
        setRewards(sorted);
        setFilteredRewards(sorted);
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

    const fetchBalances = async () => {
        if (!address) {
            return;
        }

        const bal = await getAddressBalances(address);

        setBalances(bal.balances);
    }

    const initialLoad = async () => {
        setLoading(true);
        await Promise.all([
            fetchStakingRewards(),
            fetchTokens(),
            fetchBalances()
        ]);
        setLoading(false);
    }

    const forceListRefresh = async () => {
        if (address) {
            await resetStakingRewardsCache(address);
            removeBalancesCache(address);
        }

        initialLoad();
    }

    useEffect(() => {
        initialLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address]);

    return (
        <Box>
            <DefaultBorderedBox p='$6' m='$6'>
                <Box display={'flex'} flex={1} flexDirection={{desktop: 'row', mobile: 'column'}} alignItems={'center'}
                     gap={'$2'}>
                    <Box>
                        {!showAddForm && <Button size="sm" intent="primary" onClick={() => {
                            setShowAddForm(true)
                        }}>Create Staking Reward</Button>}
                    </Box>
                    <Box display={'flex'} justifyContent={'flex-end'} flex={1}>
                        <SearchInput placeholder='Search by asset' width={20} onSubmit={onSearchSubmit}/>
                    </Box>
                </Box>
                {showAddForm &&
                    <>
                        {/* <Divider mx='$6'/> */}
                        <AddStakingRewardForm props={{
                            onCancel: () => {
                                setShowAddForm(false)
                            }, onSuccess: () => {
                                onNewStakingReward()
                            }
                        }}/>
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
                    <Box p='$6' m='$6' textAlign={'center'} display={'flex'} flex={1} justifyContent={'center'}><Text>Loading
                        ...</Text></Box>
                    :
                    (filteredRewards.length > 0 ?
                            filteredRewards.map((rew, index) => (
                                <StakingRewardDetail
                                    props={{reward: rew, tokens: allAssets, refreshList: forceListRefresh, balances: balances}}
                                    key={index}/>
                            ))
                            :
                            <Box p='$6' m='$6' textAlign={'center'} display={'flex'} flex={1} justifyContent={'center'}><Text>No
                                rewards found...</Text></Box>
                    )
                }
            </Box>
        </Box>
    );
}
