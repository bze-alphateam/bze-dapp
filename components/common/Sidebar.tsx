import {Box, Divider, Text, useColorModeValue,} from "@interchain-ui/react";
import {useRouter} from 'next/router';
import NextLink from 'next/link';
import {SidebarIcon} from "./Icons";

function SidebarItem({icon, text, path, target = '_self'}: {
    icon: string,
    text: string,
    path: string,
    target?: string
}) {
    const router = useRouter();
    const textColor = useColorModeValue("black", "white");
    const isActive = router.pathname === path;

    return (
        <NextLink href={path}
                  style={{textDecoration: 'none'}}
                  target={target}>
            <Box p={"$4"} backgroundColor={isActive ? '$divider' : 'transparent'}
                 boxShadow={isActive ? '$dark-lg' : 'transparent'} mx="$4" mt="$6" borderRadius='$xl'>
                <Text fontSize={{desktop: '$lg', mobile: '$sm'}}>
                    {SidebarIcon({type: icon, color: textColor})} {text}
                </Text>
            </Box>
        </NextLink>
    );
}

export function Sidebar() {
    return (
        <Box
            display={{desktop: 'flex', mobile: 'none'}}
            flexDirection={"column"}
            gap={"$6"}
            // flex={1}
            mb={"$6"}
            maxWidth={'$auto'}
            attributes={{
                width: '200px',
                padding: '$2',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: useColorModeValue('$blackAlpha200', '$whiteAlpha100'),
                borderRadius: '$xl',
            }}
        >
            <SidebarItem icon="trade" text="Trade" path="/"/>
            <SidebarItem icon="assets" text="Assets" path="/assets"/>
            <SidebarItem icon="rewards" text="Earn" path="/earn"/>
            <SidebarItem icon="factory" text="Token Factory" path="/factory"/>
            <SidebarItem icon="burner" text="Burner" path="/burner"/>
            <SidebarItem icon="chain-params" text="Chain Params" path="/chain-params"/>
            <Box marginTop="$auto">
                <Divider m="$2" width="$auto"/>
                <Box p={'$6'}>
                    <SidebarItem icon="external-link" text="BZE website" path="https://getbze.com" target="_blank"/>
                </Box>
            </Box>
        </Box>
    );
}

function TopBarItem({icon, text, path, target = '_self'}: {
    icon: string,
    text: string,
    path: string,
    target?: string
}) {
    const router = useRouter();
    const textColor = useColorModeValue("black", "white");
    const isActive = router.pathname === path;

    return (
        <NextLink href={path}
                  style={{textDecoration: 'none'}}
                  target={target}>
            <Box p={"$2"} backgroundColor={isActive ? '$divider' : 'transparent'}
                 boxShadow={isActive ? '$dark-lg' : 'transparent'} mx="$4" mt="$6" borderRadius='$xl'>
                <Text fontSize={{desktop: '$lg', mobile: '$sm'}}>
                    {SidebarIcon({type: icon, color: textColor})} {text}
                </Text>
            </Box>
        </NextLink>
    );
}

export function Topbar() {
    return (
        <>
            <Box
                display={{desktop: 'none', mobile: 'flex'}}
                flexDirection={"column"}
            >
                <Divider/>
                <Box
                    display={{desktop: 'none', mobile: 'flex'}}
                    flexDirection={"row"}
                    justifyContent={'center'}
                    flexWrap={'wrap'}
                    mb='$2'
                >
                    <TopBarItem icon="trade" text="Trade" path="/"/>
                    <TopBarItem icon="assets" text="Assets" path="/assets"/>
                    <TopBarItem icon="rewards" text="Earn" path="/earn"/>
                    <TopBarItem icon="factory" text="Token Factory" path="/factory"/>
                    <TopBarItem icon="burner" text="Burner" path="/burner"/>
                    <TopBarItem icon="chain-params" text="Chain Params" path="/chain-params"/>
                </Box>
                <Divider/>
            </Box>
        </>
    );
}
