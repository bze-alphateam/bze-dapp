import { Divider, Box, Text, Button, TextField, Callout, Spinner } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout } from "@/components";
import { SearchInput } from "@/components/common/Input";
import AssetList from "@/components/common/AssetList";
import { useEffect, useState } from "react";
import { Token, getAllTokens, getTokenFactoryParams } from "@/services";
import { prettyFee } from "@/utils";
import { useChain, useWallet } from "@cosmos-kit/react";
import { WalletStatus } from "cosmos-kit";
import WalletConnectCallout from "@/components/wallet/WalletCallout";
import { useToast } from "@/hooks/useToast";
import { useTx } from "@/hooks";
import { bze } from '@bze/bzejs';
import { CHAIN_NAME } from "@/config";
import { DeliverTxResponse } from "@cosmjs/stargate";
import { useRouter } from "next/router";

const minDenomLength = 2;
const { createDenom } = bze.tokenfactory.v1.MessageComposer.withTypeUrl;
const decodeResponse = bze.tokenfactory.v1.MsgCreateDenomResponse.decode


interface CreateTokenFormProps {
  onCancel: () => void,
  onSuccess?: (txResult: DeliverTxResponse) => void,
  fee: string,
}

function CreateTokenForm({props}: {props: CreateTokenFormProps}) {
  const [formDenom, setFormDenom] = useState<string>("");
  const [inputIntent, setInputIntent] = useState<"default"|"error">("default");
  const [submitPending, setSubmitPending] = useState<boolean>(false);
  
  const { address } = useChain(process.env.NEXT_PUBLIC_CHAIN_NAME ?? CHAIN_NAME);

  const { toast } = useToast();
  const { tx } = useTx();

  const onFormDenomChange = (text: string) => {
    setFormDenom(text);
    setInputIntent("default");
  }

  const validate = (): boolean => {
    if (address === undefined) {
      toast({
        type: 'error',
        title: `No wallet connected`
      })

      return false;
    }

    if (formDenom.length < minDenomLength) {
      toast({
        type: 'error',
        title: `Denomination should be at least ${minDenomLength} characters long!`
      })

      return false;
    }

    return true;
  }

  const onSubmit = async () => {
    if (!validate()) {
      setInputIntent("error");
      
      return;
    }

    setSubmitPending(true);
    const msg = createDenom({
      subdenom: formDenom,
      creator: address ?? '',
    });

    await tx([msg], {
      toast: {
        description: 'Your token has been created!'
      },
      onSuccess: (res: DeliverTxResponse) => {
        props.onSuccess ? props.onSuccess(res) : null;
      },
    });

    setSubmitPending(false);
  }

  return (
    <Box m='$6' width={'$full'}>
      <TextField
        id="denom"
        label="Denomination"
        onChange={(e) => {onFormDenomChange(e.target.value)}}
        placeholder="Enter your token's denomination"
        value={formDenom}
        intent={inputIntent}
        disabled={submitPending}
      />
      <Callout
        attributes={{
          width: '$auto',
          marginTop: '$2'
        }}
        iconName="informationLine"
        intent="warning"
        title="Denomination"
      >
        This is used to create a base denomination for your token. Once the token is created, you can mint new coins, burn existing ones, transfer ownership, or modify your token’s details. A fee of {props.fee} is paid when a token is created.
      </Callout>
      <Box display={'flex'} flexDirection={'row'} justifyContent={'space-evenly'} mt={'$12'}>
        <Button size="sm" intent="secondary" onClick={props.onCancel} disabled={submitPending}>Cancel</Button>
        <Button size="sm" intent="primary" onClick={() => {onSubmit()}} disabled={submitPending}>Create {submitPending  && <Spinner />}</Button>
      </Box>
    </Box>
  );
}

interface CallToActionBoxProps {
  onTokenCreate?: () => void
}

function CallToActionBox({props}: {props: CallToActionBoxProps}) {
  const [createTokenFee, setCreateTokenFee] = useState('Loading fee...');
  const [fee, setFee] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const { status: walletStatus } = useWallet();

  const fetchParams = async () => {
    let params = await getTokenFactoryParams();
    if (params.params === undefined) {
      setCreateTokenFee('Unknown');

      return;
    }

    //pretty fee
    let pFee = prettyFee(params.params.createDenomFee);
    setCreateTokenFee(`${pFee} Required`);
    setFee(pFee);
  }

  const onTokenCreated = (_: DeliverTxResponse) => {
    props.onTokenCreate ? props.onTokenCreate() : null
    setShowForm(false);
  }

  useEffect(() => {
    fetchParams();
  }, []);

  return (
    <DefaultBorderedBox ml='$6' mb={{desktop: '$0', mobile: '$6'}}>
        <Box display={'flex'} flexDirection={'column'} alignItems='center'>
          <Box p='$6' mt='$6'>
            <Text fontSize={'$md'} fontWeight={'$bold'} color='$primary200'>Unleash Your Creativity with BZE Blockchain's Token Factory!</Text>
          </Box>
          <Box p='$6' mb='$6'>
            <Text letterSpacing={'$wide'} fontSize={'$sm'}>Create your own custom tokens with the Token Factory module on the BZE blockchain! Experience the freedom to design denominations that operate just like any other coin on the blockchain. Enjoy the flexibility of sending and using your tokens both within the BZE ecosystem and across other blockchains through Inter-Blockchain Communication (IBC).</Text>
          </Box>
        </Box>
        <Divider/>
        <Box display={'flex'} m='$6' justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
          {showForm && walletStatus === WalletStatus.Connected && <CreateTokenForm props={{fee: fee, onCancel: () => {setShowForm(false)}, onSuccess: onTokenCreated}} />}
          {!showForm && walletStatus === WalletStatus.Connected && 
            <>
              <Button size="sm" intent="primary" onClick={() => setShowForm(true)}>Create Token</Button>
              <Box mt='$6'><Text fontSize={'$sm'} fontWeight={'$hairline'}>{createTokenFee}</Text></Box>
            </>
          }
          {walletStatus !== WalletStatus.Connected && 
            <WalletConnectCallout props={{text: 'Please connect your wallet to create tokens'}}/>
          }
        </Box>
      </DefaultBorderedBox>
  );
}

function TokenList() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Map<string, Token>>(new Map());
  const [filtered, setFiltered] = useState<Token[]>([]);

  const router = useRouter();

  const handleSearch = (query: string) => {
    setLoading(true);
    if (query.length === 0) {
      setFiltered(Array.from(list.values()));
      setLoading(false);
      return;
    }
    
    let res: Token[] = [];
    query = query.toLowerCase();
    list.forEach((token, index) => {
      if (index.toLowerCase().includes(query)) {
        res.push(token);
        return;
      }

      if (token.metadata.display.toLowerCase().includes(query) || token.metadata.name.toLowerCase().includes(query) || token.metadata.symbol.toLowerCase().includes(query)) {
        res.push(token);
      }
    });

    setFiltered(res);
    setLoading(false);
  }

  const fetchList = async () => {
    const tokens = await getAllTokens();
    setList(tokens);
    setFiltered(Array.from(tokens.values()));
    setLoading(false);
  }

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <DefaultBorderedBox 
      ml='$6' 
      flexDirection='column' 
      width={{desktop: '$containerlg', mobile: '$auto'}}
      >
       <Box
        display='flex'
        flex={1}
        justifyContent={'space-between'}
        flexDirection={'row'}
        p='$2'
        m='$4'
       >
        <Box mt='$6'>
          <Text fontSize={'$md'}>Tokens List</Text>    
        </Box>
        <SearchInput placeholder='Search token' width={20} onSubmit={handleSearch}/>
      </Box>
      <Divider mb='$2'/>
      <Box display='flex' flexDirection={'column'} p='$2' m='$4'> 
      {loading ? <Text textAlign={'center'}>Loading list...</Text> :
        <AssetList
          needChainSpace={true}
          isOtherChains={false}
          titles={['Asset', 'Verified']}
          list={
            filtered.map((token, i) => {
              return {
                isOtherChains: true,
                needChainSpace: false,
                imgSrc: token.logo,
                symbol: token.metadata.symbol,
                name:  token.metadata.name,
                tokenAmount: token.verified ? '✅ YES' : '❌ NO',
                tokenAmountPrice: token.verified ? 'Verified by BZE' : '❗ Proceed with caution',
                onWithdraw: () => {
                  router.push({
                    pathname: '/token',
                    query: {
                      denom: token.metadata.base
                    }
                  });
                },
                showWithdraw: true,
                withdrawLabel: "Details",
                
              };
            })
          }
        />
      }
      </Box>
    </DefaultBorderedBox>
  );
}

export default function Factory() {
  //used to refresh the token list component
  const [listId, setListId] = useState<number>(0);

  const onTokenCreate = () => {
    setListId(listId + 1);
  }

  return (
    <Layout>
      <Box display='block' flexDirection={'row'}>
        <Box marginBottom={'$12'} ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>Token Factory</Text>
        </Box>
      </Box >
      <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column-reverse'}}>
        <TokenList key={listId}/>
        <CallToActionBox props={{onTokenCreate: onTokenCreate}}/>
      </Box>
    </Layout>
  );
}
