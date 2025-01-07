import {Box, Tabs, Text} from "@interchain-ui/react";
import {Layout, MyRewards, StakingRewards} from "@/components";
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
            <Box display='flex' flexDirection={'row'} alignItems={'center'}>
                <Box marginBottom={'$12'} ml='$6'>
                    <Text as="h1" fontSize={'$2xl'}>Earn Crypto</Text>
                </Box>
            </Box>
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
