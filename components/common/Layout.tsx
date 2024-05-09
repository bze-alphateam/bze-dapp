import Head from "next/head";
import { Container, Divider, Box } from "@interchain-ui/react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Container attributes={{ py: "$6", height: "100vh", display: "flex", flexDirection: "column"}}>
      <Head>
        <title>BZE DApp</title>
        <meta name="description" content="BeeZee blockchain decentralized application" />
        <link rel="icon" href="/logo_320px.png" />
      </Head>
      <Header />
      <Divider mb="$6" />
      <Box display={'flex'} flexDirection={"row"} flex={1}>
        <Sidebar/>
        <Box flex={1} m={'$6'} p={'$2'} flexDirection={"row"} attributes={{ overflowY: 'auto', height: 'calc(100vh - 150px)'}}>
          {children}
        </Box>
      </Box>
      <Footer />
    </Container>
  );
}
