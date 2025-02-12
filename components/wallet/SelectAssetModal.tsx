import {UseDisclosureReturn} from "@/hooks";
import {BasicModal, Box, Text} from "@interchain-ui/react";
import {SearchInput} from "../common/Input";
import {ClickableBox} from "../common";
import {Token} from "@/services";
import {useEffect, useState} from "react";
import {truncateDenom} from "@/utils";
import LogoWithFallback from "@/components/common/LogoWithFallback";

interface SelectAssetModaLProps {
    control: UseDisclosureReturn,
    title?: string | undefined,
    list: Token[],
    onClick: (token: Token) => void,
}

export default function SelectAssetModal({props}: { props: SelectAssetModaLProps }) {
    const [filtered, setFiltered] = useState<Token[]>(props.list);

    const onSearch = (query: string) => {
        if (query == "") {
            setFiltered(props.list);
            return;
        }

        query = query.toLowerCase();
        let res: Token[] = [];
        props.list.forEach((token) => {
            if (token.metadata.display.toLowerCase().includes(query) || token.metadata.name.toLowerCase().includes(query) || token.metadata.symbol.toLowerCase().includes(query)) {
                res.push(token);
            }
        });

        setFiltered(res);
    }

    const onPressClick = (token: Token) => {
        props.onClick(token);
    }

    useEffect(() => {
        setFiltered(props.list);
    }, [props.list]);

    return (
        <BasicModal
            onClose={props.control.onClose}
            renderTrigger={function Va() {
            }}
            title={props.title ?? 'Select Asset'}
            isOpen={props.control.isOpen}
        >
            <Box display='flex' flexDirection='column' p='$6'>
                <Box mb='$6'>
                    <SearchInput placeholder="Search asset" onSubmit={onSearch} width={30}/>
                </Box>
                <Box overflowY={'scroll'} maxHeight={"30vw"}>
                    {filtered.map((asset: Token, index: number) => (
                        <ClickableBox onClick={() => {
                            onPressClick(asset)
                        }} key={index}>
                            <Box as="div" p='$2' display={'flex'} flexDirection={'row'} alignItems={'center'} flex={1}>
                                <LogoWithFallback src={asset.logo} width={"$14"} height={'$14'}/>
                                <Box display={'flex'} flex={1} justifyContent={'center'}>
                                    <Box>
                                        <Text fontSize={'$lg'} color={'$primary200'}
                                              fontWeight={'$semibold'}>{truncateDenom(asset.metadata.name)}</Text>
                                    </Box>
                                </Box>
                            </Box>
                        </ClickableBox>
                    ))}
                </Box>
            </Box>
        </BasicModal>
    )
}