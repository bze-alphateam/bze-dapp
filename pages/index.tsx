import { Divider, Box, Text, Button, TextField, Callout, Spinner, FieldLabel } from "@interchain-ui/react";
import { DefaultBorderedBox, Layout, TooltippedText } from "@/components";
import { SearchInput } from "@/components/common/Input";
import AssetList from "@/components/common/AssetList";
import { useEffect, useState } from "react";
import { Token, getAllMarkets, getAllSupplyTokens, getFactoryTokens, getTokenFactoryParams, getTradebinParams, removeAllMarketsCache, resetAllTokensCache } from "@/services";
import { getChainName, prettyFee, stringTruncateFromCenter, truncateDenom } from "@/utils";
import { useChain, useWallet } from "@cosmos-kit/react";
import { WalletStatus } from "cosmos-kit";
import WalletConnectCallout from "@/components/wallet/WalletCallout";
import { useToast } from "@/hooks/useToast";
import { useDisclosure, useTx } from "@/hooks";
import { bze } from '@bze/bzejs';
import { DeliverTxResponse } from "@cosmjs/stargate";
import { useRouter } from "next/router";
import SelectAssetModal from "@/components/wallet/SelectAssetModal";
import MarketsList from "@/components/common/MarketList";
import { MarketSDKType } from "@bze/bzejs/types/codegen/beezee/tradebin/market";

const { createMarket } = bze.tradebin.v1.MessageComposer.withTypeUrl;

interface CreateMarketFormProps {
  onCancel: () => void,
  onSuccess?: (txResult: DeliverTxResponse) => void,
  fee: string,
}

function CreateMarketForm({props}: {props: CreateMarketFormProps}) {
  const [formDenom, setFormDenom] = useState<string>("");
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [baseCoin, setBaseCoin] = useState<Token|undefined>();
  const [quoteCoin, setQuoteCoin] = useState<Token|undefined>();
  const [submitPending, setSubmitPending] = useState<boolean>(false);
  
  const { address } = useChain(getChainName());

  //modals state
  const baseDisclosure = useDisclosure();
  const quoteDisclosure = useDisclosure();

  const { toast } = useToast();
  const { tx } = useTx();
  const router = useRouter();

  const onFormDenomChange = (text: string) => {
    setFormDenom(text);
  }

  const validate = (): boolean => {
    if (address === undefined) {
      toast({
        type: 'error',
        title: `No wallet connected`
      })

      return false;
    }

    if (baseCoin === undefined) {
      toast({
        type: 'error',
        title: `Please select base coin`
      })

      return false;
    }

    if (quoteCoin === undefined) {
      toast({
        type: 'error',
        title: `Please select quote coin`
      })

      return false;
    }

    return true;
  }

  const onSubmit = async () => {
    if (!validate() || baseCoin === undefined || quoteCoin === undefined || address === undefined) {  
      return;
    }

    setSubmitPending(true);
    const msg = createMarket({
      base: baseCoin.metadata.base,
      quote: quoteCoin.metadata.base ,
      creator: address,
    });

    await tx([msg], {
      toast: {
        description: 'Market successfully created!'
      },
      onSuccess: (res: DeliverTxResponse) => {
        props.onSuccess ? props.onSuccess(res) : null;
      },
    });

    setSubmitPending(false);
  }

  const onBaseDenomSelect = (token: Token) => {
    setBaseCoin(token);
    baseDisclosure.onClose();
  }

  const onQuoteDenomSelect = (token: Token) => {
    setQuoteCoin(token);
    quoteDisclosure.onClose();
  }

  useEffect(() => {
    const fetchTokens = async () => {
      const all = await getAllSupplyTokens();
      setAllTokens(Array.from(all.values()));
    }
    fetchTokens();
  }, []);

  return (
    <>
      <SelectAssetModal props={{control: baseDisclosure, onClick: onBaseDenomSelect, list: allTokens}}/>
      <SelectAssetModal props={{control: quoteDisclosure, onClick: onQuoteDenomSelect, list: allTokens}}/>
      <Box m='$6' width={'$full'}>
        <Box display={'flex'} flexDirection={'row'} flex={1} justifyContent={'space-evenly'}>
          <Box p='$2'>
            <FieldLabel htmlFor="base-denom" label={<TooltippedText text="Market coin" tooltip="The base coin is the first currency listed in a trading pair and is the asset being traded. For example, in the trading pair VDL/BZE, VDL is the base coin. When you create a market or place an order, you are either buying or selling this base coin (VDL) against the quote coin."/>} attributes={{marginBottom: '12px'}}></FieldLabel>
            <Button intent="text" key={"base-denom"} disabled={submitPending} size='sm' leftIcon={baseCoin === undefined ? "add": undefined} onClick={baseDisclosure.onOpen}>{baseCoin === undefined ? "Pick coin" : truncateDenom(baseCoin.metadata.name)}</Button>
          </Box>
          <Box p='$2'>
            <FieldLabel htmlFor="quote-denom" label={<TooltippedText text="Quote coin" tooltip="The quote coin is the second currency listed in a trading pair and is used to price the base coin. For instance, in the trading pair VDL/BZE, BZE is the quote coin. The price of the base coin (VDL) is expressed in terms of the quote coin (BZE). In other words, it shows how much of the quote coin is needed to purchase one unit of the base coin."/>} attributes={{marginBottom: '12px'}}></FieldLabel>
            <Button intent="text" key={"quote-denom"} disabled={submitPending} size='sm' leftIcon={quoteCoin === undefined ? "add": undefined} onClick={quoteDisclosure.onOpen}>{quoteCoin === undefined ? "Pick coin" : truncateDenom(quoteCoin.metadata.name)}</Button>
          </Box>
        </Box>
        <Callout
          attributes={{
            width: '$auto',
            marginTop: '$2'
          }}
          iconName="informationLine"
          intent="warning"
          title="Create denom fee"
        >
          You will pay a fee of {props.fee} to create the market.
        </Callout>
        <Box display={'flex'} flexDirection={'row'} justifyContent={'space-evenly'} mt={'$12'}>
          <Button size="sm" intent="secondary" onClick={props.onCancel} disabled={submitPending}>Cancel</Button>
          <Button size="sm" intent="primary" onClick={() => {onSubmit()}} disabled={submitPending} isLoading={submitPending}>Create</Button>
        </Box>
      </Box>
    </>
  );
}

interface CallToActionBoxProps {
  onMarketCreated: () => void
}

function CallToActionBox({props}: {props: CallToActionBoxProps}) {
  const [createMarketFee, setCreateMarketFee] = useState('Loading fee...');
  const [fee, setFee] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const { status: walletStatus } = useWallet();

  const fetchParams = async () => {
    let params = await getTradebinParams();
    if (params.params === undefined) {
      setCreateMarketFee('Unknown');

      return;
    }

    //pretty fee
    let pFee = prettyFee(params.params.createMarketFee);
    setCreateMarketFee(`${pFee} Required`);
    setFee(pFee);
  }

  const onMarketCreated = (_: DeliverTxResponse) => {
    props.onMarketCreated ? props.onMarketCreated() : null
    setShowForm(false);
  }

  useEffect(() => {
    fetchParams();
  }, []);

  return (
    <Box mx={{desktop: '$12', mobile: '$6'}} mb={{desktop: '$0', mobile: '$12'}}>
      <DefaultBorderedBox>
        <Box display={'flex'} flexDirection={'column'} alignItems='center'>
          <Box p='$6' mt='$6'>
            <Text fontSize={'$md'} fontWeight={'$bold'} color='$primary200'>Create a trading market for your tokens</Text>
          </Box>
          <Box p='$6' mb='$6'>
            <Text letterSpacing={'$wide'} fontSize={'$sm'}>Create your own trading market on our decentralized exchange! With our orderbook style DEX, you have the power to create and manage markets between any two assets, whether they&apos;re native coins, tokens, or IBC assets.</Text>
          </Box>
        </Box>
        <Divider/>
        <Box display={'flex'} m='$6' justifyContent={'center'} alignItems={'center'} flexDirection={'column'}>
          {showForm && walletStatus === WalletStatus.Connected && <CreateMarketForm props={{fee: fee, onCancel: () => {setShowForm(false)}, onSuccess: onMarketCreated}} />}
          {!showForm && walletStatus === WalletStatus.Connected && 
            <>
              <Button size="sm" intent="primary" onClick={() => setShowForm(true)}>Create Market</Button>
              <Box mt='$6'><Text fontSize={'$sm'} fontWeight={'$hairline'}>{createMarketFee}</Text></Box>
            </>
          }
          {walletStatus !== WalletStatus.Connected && 
            <WalletConnectCallout props={{text: 'Please connect your wallet to create markets'}}/>
          }
        </Box>
      </DefaultBorderedBox>
    </Box>
  );
}

interface MarketListProps {
  list: MarketSDKType[];
  tokens: Map<string, Token>;
  loading: boolean;
}

function MarketsListing(props: MarketListProps) {
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState<Map<string, Token>>(new Map());
  const [list, setList] = useState<MarketSDKType[]>([]);
  const [filtered, setFiltered] = useState<MarketSDKType[]>([]);

  const router = useRouter();

  const handleSearch = (query: string) => {
    setLoading(true);
    if (query.length === 0) {
      setFiltered(list);
      setLoading(false);
      return;
    }
    
    let res: MarketSDKType[] = [];
    query = query.toLowerCase();
    list.forEach((market) => {
      if (market.base.toLowerCase().includes(query) || market.quote.toLowerCase().includes(query)) {
        res.push(market);
        return;
      }

      const baseToken = tokens.get(market.base);
      const quoteToken = tokens.get(market.quote);
      if (baseToken === undefined || quoteToken === undefined) {
        return;
      }

      if (baseToken.metadata.display.toLowerCase().includes(query) || baseToken.metadata.name.toLowerCase().includes(query) || baseToken.metadata.symbol.toLowerCase().includes(query)) {
        res.push(market);
      }

      if (quoteToken.metadata.display.toLowerCase().includes(query) || quoteToken.metadata.name.toLowerCase().includes(query) || quoteToken.metadata.symbol.toLowerCase().includes(query)) {
        res.push(market);
      }
    });

    setFiltered(res);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(props.loading);
    setList(props.list);
    setFiltered(props.list);
    setTokens(props.tokens);
  }, [props]);

  return (
    <DefaultBorderedBox 
      ml='$6' 
      mr={{desktop: '$0', mobile: '$6'}}
      mb='$6'
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
          <Text fontSize={'$md'}>Markets</Text>    
        </Box>
        <SearchInput placeholder='Search market' width={20} onSubmit={handleSearch}/>
      </Box>
      <Divider mb='$2'/>
      <Box display='flex' flexDirection={'column'} p='$2' m='$4'> 
      {loading ? 
        <MarketsList
          titles={['Market', 'Details']}
          list={[]}
          /> :
        <MarketsList
          titles={['Market', 'Details']}
          list={
            filtered.map((market, i) => {
              return {
                onWithdraw: () => {
                  // router.push({
                  //   pathname: '/token',
                  //   query: {
                  //     denom: token.metadata.base
                  //   }
                  // });
                },
                showWithdraw: true,
                withdrawLabel: "Trade",
                baseToken: tokens.get(market.base),
                quoteToken: tokens.get(market.quote),
              };
            })
          }
        />
      }
      </Box>
    </DefaultBorderedBox>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [allTokens, setAllTokens] = useState<Map<string, Token>>(new Map());
  const [list, setList] = useState<MarketSDKType[]>([]);

  const fetchList = async () => {
    const [resp, tokens] = await Promise.all([getAllMarkets(), getAllSupplyTokens()]);

    setAllTokens(tokens);
    setList(resp.market);
    setLoading(false);
  }

  const reloadList = async () => {
    await removeAllMarketsCache();
    fetchList();
  }

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <Layout>
      <Box display='block' flexDirection={'row'}>
        <Box marginBottom={'$12'} ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>Trade</Text>
        </Box>
      </Box >
      <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column-reverse'}}>
        <MarketsListing loading={loading} list={list} tokens={allTokens}/>
        <CallToActionBox props={{onMarketCreated: reloadList}}/>
      </Box>
    </Layout>
  );
}
