import { DefaultBorderedBox, Layout, TooltippedText } from "@/components";
import { getTokenAdminAddress, getTokenChainMetadata, getTokenDisplayDenom, getTokenSupply, resetAllTokensCache } from "@/services";
import { Box, Button, Callout, Divider, Icon, Text, TextField, Tooltip } from "@interchain-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DenomUnitSDKType, MetadataSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import { useToast, useTx } from "@/hooks";
import { bze } from '@bze/bzejs';
import { useChain, useWallet } from "@cosmos-kit/react";
import { WalletStatus } from "cosmos-kit";
import { amountToUAmount, getChainName, prettyAmount, uAmountToAmount } from "@/utils";

interface TokenOwnershipProps extends TokenMetadataProps {}

const { changeAdmin } = bze.tokenfactory.v1.MessageComposer.withTypeUrl;

function TokenOwnership({props}: {props: TokenOwnershipProps}) {
  const [admin, setAdmin] = useState(props.admin);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showTransferButton, setShowTransferButton] = useState<boolean>(true);
  const [showRenounceButton, setShowRenounceButton] = useState<boolean>(true);
  const [submitPending, setSubmitPending] = useState(false);
  const [to, setTo] = useState("");

  const { address } = useChain(getChainName());
  const { toast } = useToast();
  const { tx } = useTx();

  const onTransferClick = async () => {
    if (!address) {
      return;
    }

    if (!showForm) {
      setShowRenounceButton(false);
      setShowForm(true);
      return;
    }

    let trimmed = to.trim();
    if (trimmed.length === 0) {
      toast({
        type: 'error',
        title: 'Invalid new owner address',
      });

      return;
    }

    setSubmitPending(true);
    let msg = changeAdmin({
      creator: address,
      newAdmin: to,
      denom: props.chainMetadata.base,
    })

    await tx([msg], {
      toast: {
        title: 'Owner successfully changed'
      },
      onSuccess: () => {
        setAdmin(to);
      }
    })

    setSubmitPending(false);
  }

  const onRenounceClick = async () => {
    if (!address) {
      return;
    }

    if (!showWarning) {
      setShowTransferButton(false);
      setShowForm(false);
      setShowWarning(true);
      return;
    }

    setSubmitPending(true);
    let msg = changeAdmin({
      creator: address,
      newAdmin: "", //to nobody
      denom: props.chainMetadata.base,
    })

    await tx([msg], {
      toast: {
        title: 'Token owner removed'
      },
      onSuccess: () => {
        setAdmin("");
      }
    })

    setSubmitPending(false);
  }

  const onCancelClick = () => {
    setShowRenounceButton(true);
    setShowTransferButton(true);
    setShowForm(false);
    setTo("");
    setShowWarning(false);
  }

  useEffect(() => {
    setAdmin(props.admin);
  }, [props]);

  return (
    <DefaultBorderedBox mb='$12'>
      <Box p='$6' mb='$6'>
        <Text as='h3' fontSize={'$lg'} textAlign={'center'} color={'$primary200'}>Admin</Text>
        <Box mt='$4'>
          <Text fontSize={'$md'}  textAlign={'center'} color={'$primary100'}>{admin !== "" ? admin : "Nobody"}</Text>
            <Box mt='$6'>
              <Text fontSize={'$sm'}  textAlign={'center'} color={admin !== ""  ? '$textDanger' : '$textSuccess'} fontWeight={'$thin'}>{admin !== ""  ? "This address has the power to mint, burn tokens and change token metadata. Proceed with caution." : "The creator of this token gave up on the ownership. Tokens can NOT be minted anymore and the metadata can NOT be modified."}</Text>
            </Box>
        </Box>
      </Box>
      {address === admin &&
        <>
          <Divider />
          {showWarning && 
            <Box p='$6' textAlign={"center"}>
              <Text fontWeight={'$bold'} color={"$textDanger"}>Are you sure?</Text>
              <Text fontWeight={'$light'} color={"$textDanger"}>Giving up ownership of the token is an irreversible action! You will NOT be able to undo this action, mint, burn tokens or edit metadata.</Text>
            </Box>
          }
          <Box p='$6' flexDirection={'row'} display={'flex'} alignItems={'center'}>
            {showForm && 
                <TextField
                  id="transfer"
                  type="text"
                  inputMode="text"
                  label={""}
                  size="sm"
                  onChange={(e) => {setTo(e.target.value)}}
                  placeholder="New owner address"
                  value={to}
                  intent={'default'}
                  disabled={submitPending}
                />
              }
            <Box flexDirection={'row'} display={'flex'} justifyContent={'space-around'} flex={1} alignItems={'center'}>
              {(showForm || showWarning) && <Button size="sm" intent="secondary" onClick={() => {onCancelClick()}} disabled={submitPending}>Cancel</Button>}
              {showRenounceButton && <Button size="sm" intent="primary" onClick={() => {onRenounceClick()}} isLoading={submitPending}>Give Up Ownership</Button>}
              {showTransferButton && <Button size="sm" intent="primary" onClick={() => {onTransferClick()}} isLoading={submitPending}>Transfer Ownership</Button>}
            </Box>
          </Box>
        </>
      }
    </DefaultBorderedBox>
  );
}

const { mint, burn } = bze.tokenfactory.v1.MessageComposer.withTypeUrl;

interface TokenSupplyProps extends TokenMetadataProps {}

function TokenSupply({props}: {props: TokenSupplyProps}) {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showBurnButton, setShowBurnButton] = useState<boolean>(true);
  const [showMintButton, setShowMintButton] = useState<boolean>(true);
  const [submitPending, setSubmitPending] = useState(false);

  const [amount, setAmount] = useState("");
  const [supply, setSupply] = useState<string>("0");
  const [denomUnit, setDenomUnit] = useState<DenomUnitSDKType>();

  const { address } = useChain(getChainName());
  const { toast } = useToast();
  const { tx } = useTx();

  const fetchSupply = async () => {
    const s = await getTokenSupply(props.chainMetadata.base);
    const denomUnit = await getTokenDisplayDenom(props.chainMetadata.base);
    setDenomUnit(denomUnit);
    const pretty = uAmountToAmount(s, denomUnit.exponent);
    setSupply(prettyAmount(pretty));
  }

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
        description: 'Amount should be higher than 0'
      });
      return false;
    }

    return true;
  }

  const onMintClick = async () => {
    if (!address || !denomUnit) {
      return;
    }

    if (!showForm) {
      setShowForm(true);
      setShowBurnButton(false);
      return;
    }

    if (!validateAmount(amount)) {
      return;
    }

    setSubmitPending(true);
    let uAmount = amountToUAmount(amount, denomUnit.exponent);
    let msg = mint({
      creator: address,
      coins: `${uAmount}${props.chainMetadata.base}`
    })

    await tx([msg], {
      toast: {
        description: 'Mint successful'
      },
      onSuccess: () => {
        resetAllTokensCache();
        fetchSupply();
        onCancelClick();
      }
    });
    setSubmitPending(false);
  }

  const onBurnClick = async () => {
    if (!address || !denomUnit) {
      return;
    }

    if (!showForm) {
      setShowForm(true);
      setShowMintButton(false);
      return;
    }


    if (!validateAmount(amount)) {
      return;
    }

    setSubmitPending(true);
    let uAmount = amountToUAmount(amount, denomUnit.exponent);
    let msg = burn({
      creator: address,
      coins: `${uAmount}${props.chainMetadata.base}`
    })

    await tx([msg], {
      toast: {
        description: 'Burn successful'
      },
      onSuccess: () => {
        resetAllTokensCache();
        fetchSupply();
        onCancelClick();
      }
    });
    setSubmitPending(false);
  }

  const onCancelClick = () => {
    setShowForm(false);
    setShowMintButton(true);
    setShowBurnButton(true);
    setAmount("");
  }

  useEffect(() => {
    fetchSupply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DefaultBorderedBox mb='$12'>
      <Box p='$6' mb='$6'>
        <Text as='h3' fontSize={'$lg'} textAlign={'center'} color={'$primary200'}>Supply</Text>
        <Box mt='$4'>
          <Text fontSize={'$md'}  textAlign={'center'} color={'$primary100'}>{supply}</Text>
          <Text fontSize={'$md'}  textAlign={'center'} color={'$primary100'}>{denomUnit?.denom}</Text>
        </Box>
      </Box>
      {address === props.admin &&
        <>
          <Divider />
          <Box p='$6' flexDirection={'row'} display={'flex'} justifyContent={'space-around'} alignItems={'center'}>
            {showForm && 
              <TextField
                id="burn-mint-amount"
                type="number"
                inputMode="numeric"
                label={""}
                size="sm"
                onChange={(e) => {setAmount(e.target.value)}}
                placeholder="Amount to burn/mint"
                value={amount}
                intent={'default'}
                disabled={submitPending}
              />
            }
            {(!showBurnButton || !showMintButton) && <Button size="sm" intent="secondary" onClick={() => {onCancelClick()}} disabled={submitPending}>Cancel</Button>}
            {showBurnButton && <Button size="sm" intent="primary" onClick={() => {onBurnClick()}} isLoading={submitPending}>Burn</Button>}
            {showMintButton && <Button size="sm" intent="primary" onClick={() => {onMintClick()}} isLoading={submitPending}>Mint</Button>}
          </Box>
        </>
      }
    </DefaultBorderedBox>
  );
}

const { setDenomMetadata } = bze.tokenfactory.v1.MessageComposer.withTypeUrl;

interface TokenMetadataProps {
  chainMetadata: MetadataSDKType,
  admin: string,
  onUpdate: () => void,
}

function TokenMetadata({props}: {props: TokenMetadataProps}) {
  const [disabled, setDisabled] = useState(true);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  
  //form entries
  const [name, setName] = useState<string>(props.chainMetadata.name);
  const [symbol, setSymbol] = useState<string>(props.chainMetadata.symbol);
  const [display, setDisplay] = useState<string>('');
  const [decimals, setDecimals] = useState("6");
  const [description, setDescription] = useState(props.chainMetadata.description);

  //hooks
  const { tx } = useTx();
  const { toast } = useToast();
  const { address } = useChain(getChainName());
  const { status: walletStatus } = useWallet();

  const onEditSave = async () => {
    if (!address) {
      return;
    }

    if (name.length < 2 || name.length > 32) {
      toast({
        type: 'error',
        title: 'Invalid name',
        description: 'Name should have between 2 and 32 characters',
      })

      return;
    }

    if (symbol.length < 2 || symbol.length > 12) {
      toast({
        type: 'error',
        title: 'Invalid symbol',
        description: 'Symbol should have between 2 and 12 characters',
      })

      return;
    }

    if (display.length < 2 || display.length > 12) {
      toast({
        type: 'error',
        title: 'Invalid display denom',
        description: 'Display denom should have between 2 and 12 characters',
      })

      return;
    }

    let intDecimals = parseInt(decimals)
    if (intDecimals === 0 || intDecimals > 18) {
      toast({
        type: 'error',
        title: 'Invalid decimals',
        description: 'Decimals should be higher than 0 and lower than 19',
      })

      return;
    }

    setPendingSubmit(true);
    const msg = setDenomMetadata({
      creator: address,
      metadata: {
        base: props.chainMetadata.base,
        symbol: symbol,
        description: description,
        display: display,
        name: name,
        denomUnits: [
          {
            denom: props.chainMetadata.base,
            exponent: 0,
            aliases: [],
          },
          {
            denom: display,
            exponent: intDecimals,
            aliases: [],
          },
        ],
        uri: "",
        uriHash: "",
      }
    });

    await tx([msg], {
      toast: {
        description: 'Token metadata successfuly saved'
      },
      onSuccess: () => {
        setDisabled(true);
        props.onUpdate();
      },
    });

    setPendingSubmit(false);
  }

  const onEditClick = () => {
    setDisabled(false);
  }

  const onEditCancel = () => {
    setName(props.chainMetadata.name);
    setSymbol(props.chainMetadata.symbol);
    setDisplay(props.chainMetadata.display);
    setDescription(props.chainMetadata.description);
    defaultDisplayAndDecimals();
    setDisabled(true);
  }

  const defaultDisplayAndDecimals = () => {
    let metaDenoms = props.chainMetadata.denom_units.filter((item) => item.denom != props.chainMetadata.base);
    if (metaDenoms.length === 0) {
      return;
    }
    setDisplay(metaDenoms[0].denom);
    setDecimals(`${metaDenoms[0].exponent}`);
  }

  useEffect(() => {
    defaultDisplayAndDecimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DefaultBorderedBox mx='$6' width={{desktop: '$containerMd', mobile: '$auto'}}>
      {address === props.admin && 
        props.chainMetadata.display === "" &&
      <Callout
        attributes={{
          width: '$auto',
          margin: '$2'
        }}
        iconName="informationLine"
        intent="success"
        title="Add token details"
      >
        It is recommended to add full metadata to your token. The metadata is used to display token&apos;s human readable details throughout the application. 
      </Callout>
      }
      <Box p='$6'>
        <Text as="h3" fontSize={'xl'} color='$primary200'>Metadata</Text>
      </Box>
      <Box p='$6'>
        <TextField
          id="base"
          label={
            <TooltippedText text="Base denomination" tooltip="This is the denomination generated by the blockchain when the token was created and it can not be changed"/>
          }
          size="sm"
          value={props.chainMetadata.base}
          intent={'default'}
          readonly={true}
        />
      </Box>
      <Divider />
      <Box p='$6'>
        <TextField
          id="name"
          label={
            <TooltippedText text="Name (ex: BeeZee)" tooltip="The full name of the token."/>
          }
          size="sm"
          onChange={(e) => {setName(e.target.value)}}
          placeholder="Token's name"
          value={name}
          intent={'default'}
          disabled={disabled || pendingSubmit}
        />
      </Box>
      <Box p='$6'>
        <TextField
          id="symbol"
          label={
            <TooltippedText text="Ticker/Symbol (ex: BZE)" tooltip="The ticker is usually the short name of the token."/>
          }
          size="sm"
          onChange={(e) => {setSymbol(e.target.value)}}
          placeholder="Token's symbol"
          value={symbol}
          intent={'default'}
          disabled={disabled || pendingSubmit}
        />
      </Box>
      <Box p='$6' flexDirection={{desktop: 'row', mobile: 'column'}} display={'flex'} justifyContent={'space-between'} width={'$auto'}>
        <TextField
          id="display"
          label={
            <TooltippedText text="Display denom (ex: BZE)" tooltip="The largest denomination of the token. Take bitcoin for example: sats is the smallest denomination while BTC is the largest one with 8 decimals"/>
          }
          size="sm"
          onChange={(e) => {setDisplay(e.target.value)}}
          placeholder="Token's display denomination"
          value={display}
          intent={'default'}
          disabled={disabled || pendingSubmit}
          attributes={{
            width: {desktop: '60%', mobile: '$full'},
            marginRight: '15px'
          }}
        />
        <TextField
          id="decimals"
          label={
            <TooltippedText text="Decimals/Exponent (ex: 6)" tooltip="The number of decimals for the largest denomination."/>
          }
          type="number"
          size="sm"
          onChange={(e) => {setDecimals(e.target.value)}}
          placeholder="Number of decimals"
          value={decimals}
          inputMode='numeric'
          intent={'default'}
          disabled={disabled || pendingSubmit}
          attributes={{
            width: {desktop: '40%', mobile: '$full'},
            marginTop: {mobile: '15px', desktop: "0px"},
          }}
        />
      </Box>
      <Box p='$6'>
        <TextField
          id="description"
          label="Token's description"
          size="sm"
          onChange={(e) => {setDescription(e.target.value)}}
          placeholder="Token's description"
          value={description}
          intent={'default'}
          disabled={disabled || pendingSubmit}
        />
      </Box>
      {disabled && walletStatus === WalletStatus.Connected && props.admin === address && 
        <Box display={'flex'} m='$6' justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
          <Button size="sm" intent="primary" onClick={() => {onEditClick()}}>Edit</Button>
        </Box>
      }
      {!disabled && 
        <Box display={'flex'} m='$6' justifyContent={'space-evenly'} flexDirection={'row'}>
          <Button size="sm" intent="secondary" onClick={() => {onEditCancel()}} disabled={pendingSubmit}>Cancel</Button>
          <Button size="sm" intent="primary" onClick={() => {onEditSave()}} disabled={pendingSubmit} isLoading={pendingSubmit}>Save</Button>
        </Box>
      }
    </DefaultBorderedBox>
  );
}

export default function Token() {
  const [loading, setLoading] = useState(true);
  const [chainMetadata, setChainMetadata] = useState<Awaited<ReturnType<typeof getTokenChainMetadata>>>();
  const [admin, setAdmin] = useState('');

  const router = useRouter();
  const { query } = router;

  const fetchChainMetadata = async (denom: string|undefined) => {
    if (denom === undefined || denom === '') {
      return;
    }

    const meta = await getTokenChainMetadata(denom);
    if (meta === undefined) {
      router.push({pathname: '/404'});
      return;
    }

    setChainMetadata(meta);
    setLoading(false);
  }

  const fetchAdmin = async (denom: string|undefined) => {
    if (denom === undefined || denom === '') {
      return;
    }

    const admin = await getTokenAdminAddress(denom);
    setAdmin(admin);
  }

  const onMetadataUpdate = async (denom: string) => {
    setLoading(true);
    resetAllTokensCache();
    fetchChainMetadata(denom);
  }

  useEffect(() => {
    if (typeof query.denom !== 'string') {
      return;
    }

    fetchChainMetadata(query.denom);
    fetchAdmin(query.denom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.denom]);


  return (
    <Layout>
      <Box display='block' flexDirection={'row'}>
        <Box marginBottom={'$12'} ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>Token Details {chainMetadata?.name ? "/" : ""}<Text fontSize={'$2xl'} color={'$primary300'} as="span"> {chainMetadata?.name}</Text></Text>
        </Box>
      </Box>
      {!loading && chainMetadata &&
        <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column-reverse'}} flex={1}>
          <TokenMetadata props={{chainMetadata: chainMetadata, admin: admin, onUpdate: () => {onMetadataUpdate(chainMetadata?.base)}}} />
          <Box flex={1} mx={{desktop: '$12', mobile: '$6'}} flexDirection={'column'}>
            <Box flexDirection={'row'} flex={1}>
              <TokenSupply props={{chainMetadata: chainMetadata, admin: admin, onUpdate: () => {}}} />
              <TokenOwnership props={{chainMetadata: chainMetadata, admin: admin, onUpdate: () => {}}}/>
            </Box>
          </Box>
        </Box>
      }
    </Layout>
  );
}
