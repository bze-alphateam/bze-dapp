import { Layout } from "@/components";
import { Box, Text } from "@interchain-ui/react";

export default function CreateToken() {
  return (
    <Layout>
      <Box display='block' flexDirection={'row'}>
        <Box marginBottom={'$12'} ml='$6'>
          <Text as="h1" fontSize={'$2xl'}>Create Token</Text>
        </Box>
      </Box >
      <Box display='flex' flexDirection={{desktop: 'row', mobile: 'column-reverse'}}>
        
      </Box>
    </Layout>
  );
}
