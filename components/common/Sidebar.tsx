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
import { SidebarIcon } from "./Icons";

function SidebarItem({ icon, text }: {icon: string, text: string}) {
  const textColor = useColorModeValue("black", "white");

  return (
    <Box p={"$6"} m={"$2"}>
      <Text>
        {SidebarIcon({ type: icon, color: textColor })} {text}
      </Text>
    </Box>
  );
}

export function Sidebar() {
  return (
    <Box
      display="flex"
      flexDirection={"column"} 
      gap={"$6"} 
      flex={1}
      mb={"$6"}
      // width={200}
      // alignItems={"center"}
      // borderColor={useColorModeValue('$blackAlpha200', '$whiteAlpha100')}
      // borderWidth={0.5}
      // borderRadius={1}
      // padding={5}
      // fontSize={16}
      // height={"full"}
      attributes={{
        width: '200px',
        padding: '$1',
        justifyContent: 'center',
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
      <SidebarItem icon="trade" text="Trade" />
      <SidebarItem icon="factory" text="Token Factory" />
      <SidebarItem icon="rewards" text="Earn" />
      <SidebarItem icon="burner" text="Burner" />
      <SidebarItem icon="chain-params" text="Chain Params" />
      <Divider m={"$6"} width={"$auto"}/>
      <SidebarItem icon="external-link" text="BZE website" />
    </Box>
  );
}
