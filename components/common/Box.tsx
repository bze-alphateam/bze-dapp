import { Divider, Box, BoxProps, Text, useColorModeValue } from "@interchain-ui/react";

interface DefaultBoxProps extends BoxProps {
  children: React.ReactNode;
}

export function DefaultBorderedBox({ children, ...props}: DefaultBoxProps) {
  return(
    <Box
      boxShadow={'$dark-lg'}
      attributes={{
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: useColorModeValue('$blackAlpha200', '$whiteAlpha100'),
        borderRadius: '$xl',
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

export function ClickableBox({ children, onClick}: ClickableBoxProps) {
  return(
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}
