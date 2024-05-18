import {
  Box,
  Text,
  useColorModeValue,
  Divider,
} from "@interchain-ui/react";
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { SidebarIcon } from "./Icons";

function SidebarItem({ icon, text, path, target = '_self' }: {icon: string, text: string, path: string, target?: string}) {
  const router = useRouter();
  const textColor = useColorModeValue("black", "white");
  const isActive = router.pathname === path;

  return (
    <NextLink href={path} 
    style={{ textDecoration: 'none' }}
    target={target}>
      <Box p={"$4"} backgroundColor={isActive ? '$divider' : 'transparent'} boxShadow={isActive ? '$dark-lg' : 'transparent'} mx="$4" mt="$6" borderRadius='$xl'>
        <Text fontSize={'$lg'}>
          {SidebarIcon({ type: icon, color: textColor })} {text}
        </Text>
      </Box>
    </NextLink>
  );
}

export function Sidebar() {
  return (
    <Box
      display="flex"
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
