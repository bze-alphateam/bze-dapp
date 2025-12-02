import {Box, Button, Tabs, Text} from "@interchain-ui/react";
import {DefaultBorderedBox, DexBanner, Layout, MyRewards, StakingRewards} from "@/components";
import {useEffect, useState} from "react";
import Image from "next/image";
import {useRouter} from "next/router";


export default function Earn() {
    const router = useRouter();
    const { query } = router;

    // Get the initial tab from the URL query or default to 0
    const [currentTab, setCurrentTab] = useState(Number(query.tab) || 0);

    const onActiveTabChange = (tabIndex: number) => {
        setCurrentTab(tabIndex);
        // Update the URL query parameter without refreshing the page
        router.push(
            {
                pathname: router.pathname,
                query: { tab: tabIndex },
            },
            undefined,
            { shallow: true } // Prevent full-page reload
        );
    };

    useEffect(() => {
        if (query.tab) {
            setCurrentTab(Number(query.tab));
        }
    }, [query.tab]);

    return (
        <Layout>
            <DexBanner url={"https://dex.getbze.com/staking"}/>
            <Box display='flex' flexDirection={'row'} alignItems={'center'}>
                <Box marginBottom={'$12'} ml='$6'>
                    <Text as="h1" fontSize={'$2xl'}>Earn Crypto</Text>
                </Box>
            </Box>
            <DefaultBorderedBox mb={"$6"} display='flex' flex={1} justifyContent={'center'} alignItems={'center'} flexDirection={{mobile: 'column', desktop: 'row'}} mx={{desktop: "$6"}}>
                <Box flex={1} display={"flex"} p={"$6"}>
                    <Text fontSize={'$xl'} fontWeight={'$bold'}>Want to stake BZE? 💰</Text>
                </Box>
                <Box flex={1} display={"flex"} p={"$6"} flexDirection={"column"}>
                    <Text fontSize={'$sm'} fontWeight={'$bold'}>Delegate your BZE to network validators and be part of BeeZee.</Text>
                </Box>
                <Box display={"flex"} p={"$6"} gap={"$2"} flexDirection={{mobile: 'row', desktop: 'row'}} justifyContent={"flex-end"}>
                    <Button size={"sm"} intent={"secondary"} rightIcon={"externalLinkLine"} onClick={() => window.open("https://staking.getbze.com", "_blank", "noopener,noreferrer")}>To Staking</Button>
                </Box>
            </DefaultBorderedBox>
            <Box
                display='flex'
                flexDirection={{desktop: 'row', mobile: 'row'}}
            >
                <Tabs
                    attributes={{
                        width: '$full',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    isLazy={true}
                    onActiveTabChange={onActiveTabChange}
                    activeTab={currentTab}
                    tabs={[
                        {
                            content: <StakingRewards/>,
                            label: 'Staking rewards'
                        },
                        {
                            content:
                                <Box>
                                    <Box p={"$4"} display={"flex"} flex={1} justifyContent={"center"}>
                                        <Image src={"/beezee-bee.jpg"} alt={"The Bee is BEEZEE!"} width={400}
                                               height={400}/>
                                    </Box>
                                    <Box p={"$4"} display={"flex"} flex={1} justifyContent={"center"}>
                                        <Text fontSize={"$lg"} color={'$primary100'}>The Bee is BEEZEE building this
                                            section. Coming soon!</Text>
                                    </Box>
                                </Box>,
                            label: 'Trading rewards'
                        },
                        {
                            content: <MyRewards/>,
                            label: 'My rewards'
                        }
                    ]}
                />
            </Box>
        </Layout>
    );
}
