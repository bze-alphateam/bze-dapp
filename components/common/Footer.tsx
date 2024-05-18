import {
  Box,
  Divider,
  Link,
  Text,
} from "@interchain-ui/react";

export function Footer() {
  return (
    <>
      <Box mb="$6">
        <Divider />
      </Box>
      <Box display={'flex'} alignItems={'center'} justifyContent={'center'} flexWrap={'wrap'} textAlign={'center'}>
        <Text>Built with <Link href="https://cosmology.zone/" target="_blank">Cosmology </Link> by BZE Alpha Team. Powered by <Link href="https://getbze.com" target="_blank">BeeZee blockchain and BZE coin.</Link></Text>        
      </Box>
    </>
  );
}
