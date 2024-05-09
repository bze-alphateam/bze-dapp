import { Divider } from "@interchain-ui/react";
import { Layout, Wallet } from "@/components";
import { Sidebar } from "@/components/common/Sidebar";

export default function Home() {
  return (
    <Layout>
      <Divider mb="$6" />
      <Sidebar />
    </Layout>
  );
}
