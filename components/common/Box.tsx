import {Box, BoxProps, useColorModeValue} from "@interchain-ui/react";

interface DefaultBoxProps extends BoxProps {
    children: React.ReactNode;
}

export function DefaultBorderedBox({children, ...props}: DefaultBoxProps) {
    return (
        <Box
            boxShadow={"$xl"}
            attributes={{
                borderWidth: '3px',
                borderStyle: "solid",
                borderColor: useColorModeValue('$blackAlpha200', '$whiteAlpha100'),
                borderRadius: '$md',
            }}
            {...props}
        >
            {children}
        </Box>
    );
}

interface ClickableBoxProps {
    children: React.ReactNode;
    onClick: () => void,
}

export function ClickableBox({children, onClick}: ClickableBoxProps) {
    return (
        <div onClick={onClick} style={{cursor: 'pointer'}}>
            {children}
        </div>
    );
}
