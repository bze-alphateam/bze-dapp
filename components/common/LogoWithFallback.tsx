import React from "react";
import {Box, BoxProps} from "@interchain-ui/react";

interface LogoWithFallbackProps extends BoxProps {
  src: string;
  alt?: string;
  fallbackSrc?: string;
}

const LogoWithFallback: React.FC<LogoWithFallbackProps> = ({
  src,
  alt = "Image",
  fallbackSrc = "/token_placeholder.png",
  ...props
}) => {
  return (
    <Box
      as="img"
      attributes={{
        src: src,
        onError: (e: { currentTarget: { src: string; }; }) => (e.currentTarget.src = "/token_placeholder.png"),
      }}
      {...props}
    />
  );
};

export default LogoWithFallback;
