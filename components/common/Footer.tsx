import {
  Box,
  Divider,
  Link,
  Stack,
  Text,
} from "@interchain-ui/react";

export function Footer() {
  return (
    <>
      <Box mb="$6">
        <Divider />
      </Box>
      <Stack
        direction="horizontal"
        space="$2"
        attributes={{
          justifyContent: "center",
          opacity: 0.5,
          fontSize: "$sm",
        }}
      >
        <Text>Built with</Text>
        <Link href="https://cosmology.zone/" target="_blank">
          Cosmology
        </Link>
        <Text>by BZE Alpha Team. Powered by </Text>
        <Link href="https://getbze.com" target="_blank">
          BeeZee blockchain and BZE coin.
        </Link>
      </Stack>
    </>
  );
}
