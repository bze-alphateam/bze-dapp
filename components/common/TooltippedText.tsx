import {Box, Icon, Text, Tooltip} from "@interchain-ui/react";

interface TooltippedTextProps {
    text: string;
    tooltip: string;
}

export function TooltippedText(props: TooltippedTextProps) {
    return (
        <Box flexDirection={'row'} display={'flex'} gap={'$2'} alignItems={'center'}>
            <Text>{props.text}</Text>
            <Tooltip placement="right" title={<Text color="$textInverse">{props.tooltip}</Text>}><Icon
                name="informationLine" size="$md" attributes={{mt: '$2'}}/></Tooltip>
        </Box>
    );
}
