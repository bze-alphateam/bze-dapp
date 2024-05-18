import { Divider, Box, Text } from "@interchain-ui/react";
import { Layout } from "@/components";
import { Sidebar } from "@/components/common/Sidebar";

export default function NotFound() {
  return (
    <Layout>
      <Text fontSize={'$26'}>The page you were looking for doesn&apos;t exist</Text>
    </Layout>
  );
}