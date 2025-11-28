import {Box, Text} from "@interchain-ui/react";
import {Layout} from "@/components";
import Image from "next/image";

export default function Burner() {
    return (
        <Layout>
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='center'
                minHeight='60vh'
                p='$12'
            >
                <Box mb='$8' textAlign='center'>
                    <Text as="h1" fontSize='$2xl' fontWeight='$bold' color='$primary300'>
                        Burner Has Moved
                    </Text>
                </Box>

                <Box mb='$8' maxWidth='600px'>
                    <Image
                        src="/bee-burning-coins.png"
                        alt="Bee Burning Coins"
                        width={400}
                        height={400}
                        style={{width: '100%', height: 'auto'}}
                    />
                </Box>

                <Box maxWidth='700px' textAlign='center'>
                    <Text fontSize='$lg' color='$primary200' lineHeight='1.6'>
                        The burner feature has moved to an improved app with better UI and experience.
                        Please visit the new platform to access all burning and raffle features.
                    </Text>
                </Box>

                <Box mt='$12'>
                    <a
                        href="https://burner.getbze.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{textDecoration: 'none'}}
                    >
                        <button
                            style={{
                                backgroundColor: '#ff6b00',
                                color: 'white',
                                padding: '16px 32px',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 0, 0.4)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            Visit New Burner Platform
                        </button>
                    </a>
                </Box>
            </Box>
        </Layout>
    );
}
