import { DefaultBorderedBox, Layout } from "@/components";
import { getTokenAdminAddress, getTokenChainMetadata, getTokenDisplayDenom, getTokenSupply } from "@/services";
import { Box, Button, Divider, Spinner, Text, TextField, Tooltip } from "@interchain-ui/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { MetadataSDKType } from "@bze/bzejs/types/codegen/cosmos/bank/v1beta1/bank";
import { useToast, useTx } from "@/hooks";
import { bze } from '@bze/bzejs';
import { useChain, useWallet } from "@cosmos-kit/react";
import { WalletStatus } from "cosmos-kit";
import { getChainName, prettyAmount, uAmountToAmount } from "@/utils";

interface TokenOwnershipProps extends TokenMetadataProps {}

function TokenOwnership({props}: {props: TokenOwnershipProps}) {
  const { address } = useChain(getChainName());

  return (
    <DefaultBorderedBox m='$12'>
      <Box p='$6' mb='$6'>
        <Text as='h3' fontSize={'$lg'} textAlign={'center'} color={'$primary200'}>Admin</Text>
        <Box mt='$4'>
          <Text fontSize={'$md'}  textAlign={'center'} color={'$primary100'}>{props.admin}</Text>
          <Box mt='$6'>
            <Text fontSize={'$sm'}  textAlign={'center'} color={'$primary50'} fontWeight={'$thin'}>This address has the power to mint, burn tokens and change token metadata. Proceed with caution.</Text>
          </Box>
        </Box>
      </Box>
      {address === props.admin &&
        <>
          <Divider />
          <Box p='$6' flexDirection={'row'} display={'flex'} justifyContent={'space-around'}>
            <Button size="sm" intent="primary" onClick={() => {}}>Give Up Ownership</Button>
            <Button size="sm" intent="primary" onClick={() => {}}>Transfer Ownership</Button>
          </Box>
        </>
      }
    </DefaultBorderedBox>
  );
}

interface TokenSupplyProps extends TokenMetadataProps {}

function TokenSupply({props}: {props: TokenSupplyProps}) {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showBurnButton, setShowBurnButton] = useState<boolean>(true);
  const [showMintButton, setShowMintButton] = useState<boolean>(true);

  const [amount, setAmount] = useState("0");
  const [supply, setSupply] = useState<string>("0");
  const [denom, setDenom] = useState<string>("");

  const { address } = useChain(getChainName());

  const fetchSupply = async () => {
    const s = await getTokenSupply(props.chainMetadata.base);
    const denomUnit = await getTokenDisplayDenom(props.chainMetadata.base);
    if (denomUnit === undefined) {
      return;
    }

    const pretty = uAmountToAmount(s, denomUnit.exponent);
    setSupply(prettyAmount(pretty));
    setDenom(denomUnit.denom)
  }

  const onMintClick = async () => {
    if (!showForm) {
      setShowForm(true);
      setShowBurnButton(false);
      return;
    }
  }

  const onBurnClick = async () => {
    if (!showForm) {
      setShowForm(true);
      setShowMintButton(false);
      return;
    }
  }

  const onCancelClick = () => {
    setShowForm(false);
    setShowMintButton(true);
    setShowBurnButton(true);
    setAmount("0");
  }

  useEffect(() => {
    fetchSupply();
  }, []);

  return (
    <DefaultBorderedBox m='$12'>
      <Box p='$6' mb='$6'>
        <Text as='h3' fontSize={'$lg'} textAlign={'center'} color={'$primary200'}>Supply</Text>
        <Box mt='$4'>
          <Text fontSize={'$md'}  textAlign={'center'} color={'$primary100'}>{supply} {denom}</Text>
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
                // disabled={disabled || pendingSubmit}
              />
            }
            {(!showBurnButton || !showMintButton) && <Button size="sm" intent="secondary" onClick={() => {onCancelClick()}}>Cancel</Button>}
            {showBurnButton && <Button size="sm" intent="primary" onClick={() => {onBurnClick()}}>Burn</Button>}
            {showMintButton && <Button size="sm" intent="primary" onClick={() => {onMintClick()}}>Mint</Button>}
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
  }, []);

  return (
    <DefaultBorderedBox ml='$6' width={{desktop: '$containerMd', mobile: '$auto'}}>
      <Box p='$6'>
        <Text as="h3" fontSize={'xl'} color='$primary200'>Metadata</Text>
      </Box>
      <Box p='$6'>
        <TextField
          id="base"
          label={
            <Tooltip placement="right" title={<Text color="$textInverse">This is the denomination generated by the blockchain when the token was created and it can not be changed</Text>}>Base denomination</Tooltip>
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
            <Tooltip placement="right" title={<Text color="$textInverse">The full name of the token.</Text>}>Name (ex: BeeZee)</Tooltip>
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
            <Tooltip placement="right" title={<Text color="$textInverse">The ticker is usually the short name of the token.</Text>}>Ticker/Symbol (ex: BZE)</Tooltip>
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
            <Tooltip placement="right" title={<Text color="$textInverse">The largest denomination of the token. Take bitcoin for example: sats is the smallest denomination while BTC is the largest one with 8 decimals.</Text>}>Display denom (ex: bze)</Tooltip>
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
            <Tooltip placement="right" title={<Text color="$textInverse">The number of decimals for the largest denomination.</Text>}>Decimals/Exponent (ex: 6)</Tooltip>
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

  useEffect(() => {
    if (typeof query.denom !== 'string') {
      return;
    }

    fetchChainMetadata(query.denom);
    fetchAdmin(query.denom);
  }, [query.denom]);


  return (
    <Layout>
      <Box display='block' flexDirection={'row'}>
        <Box marginBottom={'$12'} ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>Token details</Text>
        </Box>
      </Box>
      {!loading && chainMetadata &&
        <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column'}} flex={1}>
          <TokenMetadata props={{chainMetadata: chainMetadata, admin: admin}} />
          <DefaultBorderedBox marginLeft='$6' flex={1} marginTop={{desktop: '$0', mobile: '$6'}} flexDirection={'column'}>
            <Box flexDirection={'row'} flex={1}>
              <TokenSupply props={{chainMetadata: chainMetadata, admin: admin}} />
              <TokenOwnership props={{chainMetadata: chainMetadata, admin: admin}}/>
            </Box>
          </DefaultBorderedBox>
        </Box>
      }
    </Layout>
  );
}