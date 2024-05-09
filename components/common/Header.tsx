import {
  Box,
  Button,
  Icon,
  Link,
  Text,
  useColorModeValue,
  useTheme,
} from "@interchain-ui/react";
import { Wallet } from "../wallet";
import Image from "next/image";

export function Header() {
  const { theme, setTheme } = useTheme();

  const toggleColorMode = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <>
      <Box display="flex" mb="$8" flexDirection={"row"}>
        <Image src={useColorModeValue("/beezee_dark.svg", "/beezee_light.svg")} alt="beezee blockchain" width={178} height={40} priority={true}/>
        <Box display="flex" justifyContent="end" gap={5} flex={1}>
          <Wallet />
          <Box marginX={"$6"}>
            <Button
              intent="secondary"
              size="sm"
              attributes={{
                paddingX: 0,
              }}
              onClick={toggleColorMode}
            >
              <Icon name={useColorModeValue("moonLine", "sunLine")} />
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
