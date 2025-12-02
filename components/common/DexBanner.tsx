import {Box, Text} from "@interchain-ui/react";

export default function DexBanner({url}: {url?: string}) {
    return (
        <Box
            display='flex'
            flexDirection={{mobile: 'column', desktop: 'row'}}
            alignItems='center'
            justifyContent='space-between'
            p='$6'
            mb='$6'
            mx={{desktop: '$6', mobile: '$0'}}
        >
            <Box flex={1} mr={{desktop: '$8', mobile: '$0'}} mb={{mobile: '$4', desktop: '$0'}}>
                <Text fontSize='$lg' fontWeight='$bold' color='$primary200'>
                    Try Our New DEX Experience!
                </Text>
                <Text fontSize='$sm' color='$primary100'>
                    Discover the improved user interface with enhanced features and better performance.
                </Text>
            </Box>
            <Box>
                <a
                    href={url ?? "https://dex.getbze.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{textDecoration: 'none'}}
                >
                    <button
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        Visit New DEX
                    </button>
                </a>
            </Box>
        </Box>
    );
}
