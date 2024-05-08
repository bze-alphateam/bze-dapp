import Head from "next/head";
import { Container } from "@interchain-ui/react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Container attributes={{ py: "$6" }}>
      <Head>
        <title>BZE DApp</title>
        <meta name="description" content="BeeZee blockchain decentralized application" />
        <link rel="icon" href="/logo_320px.png" />
      </Head>
      <Header />
      {children}
      <Footer />
    </Container>
  );
}
