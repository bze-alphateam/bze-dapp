import {
  Box,
  Button,
  Center,
  Container,
  Link,
  Text,
  useColorModeValue,
  useTheme,
  Divider,
  Icon,
} from "@interchain-ui/react";
import { useRouter } from 'next/router';
import { SidebarIcon } from "./Icons";

function SidebarItem({ icon, text, path, target = '_self' }: {icon: string, text: string, path: string, target?: string}) {
  const router = useRouter();
  const textColor = useColorModeValue("black", "white");
  const isActive = router.pathname === path;

  return (
    <Link href={path} underline={!isActive} background={isActive} attributes={{marginX: '$4', marginTop: '$2'}} target={target}>
      <Box p={"$2"}>
        <Text fontSize={'$md'}>
          {SidebarIcon({ type: icon, color: textColor })} {text}
        </Text>
      </Box>
    </Link>
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
        // boxShadow: {
        //   base: 'none',
        //   hover: useColorModeValue(
        //     '0 2px 5px #ccc',
        //     '0 1px 3px #727272, 0 2px 12px -2px #2f2f2f'
        //   ),
        // },
      }}
      // textColor={useColorModeValue(PRIMARY_TEXT_LIGHT, PRIMARY_TEXT_DARK)}
    >
      <SidebarItem icon="trade" text="Trade" path="/"/>
      <SidebarItem icon="factory" text="Token Factory" path="/factory"/>
      <SidebarItem icon="rewards" text="Earn" path="/earn"/>
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
