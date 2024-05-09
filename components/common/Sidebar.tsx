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
import { BurnerIcon, ChainParamsIcon, ExternalLinkIcon, FactoryIcon, RewardsIcon, TradeIcon } from "./Icons";

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
      <Box p={"$6"} m={"$2"}>  
        <TradeIcon width={15} height={15}/> Trade
      </Box>
      <Box p={"$6"} m={"$2"}>  
        <FactoryIcon width={15} height={15}/> Token Factory
      </Box>
      <Box p={"$6"} m={"$2"}>  
        <RewardsIcon width={15} height={15}/> Earn
      </Box>
      <Box p={"$6"} m={"$2"}>  
        <BurnerIcon width={15} height={15}/> Burner
      </Box>
      <Box p={"$6"} m={"$2"}>  
        <ChainParamsIcon width={15} height={15}/> Chain Params
      </Box>
      <Divider m={"$6"} width={"$auto"}/>
      <Box p={"$6"} mt={"$16"}>  
        <ExternalLinkIcon width={15} height={15}/> BZE website
      </Box>
    </Box>
  );
}
