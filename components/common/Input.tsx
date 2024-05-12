import { Box, Button, Link, useColorModeValue } from "@interchain-ui/react";
import { DefaultBorderedBox } from "./Box";
import { SearchIcon } from "./Icons";
import { useState } from "react";
import { addDebounce, cancelDebounce } from "@/utils";

const searchDelay = 2000; // 2 seconds
const searchDebounceName = 'search:input';

interface SearchInputProps {
  onSubmit: (input: string) => void,
  placeholder: string,
  width: number,
  isLoading?: boolean,
}

export function SearchInput(props: SearchInputProps) {
  const [text, setText] = useState<string>('');
  const textColor = useColorModeValue("black", "white");

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setText(newValue);
    if (newValue.length < 2) {
      cancelDebounce(searchDebounceName);
    } else {
      addDebounce(searchDebounceName, searchDelay, () => {props.onSubmit(newValue)});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      submitInput();
    }
  };

  const submitInput = () => {
    cancelDebounce(searchDebounceName);
    props.onSubmit(text);
  }

  return(
    <DefaultBorderedBox display={'flex'}>
      <input 
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder} 
        size={props.width} 
        style={{
          background: 'transparent',
          border: 'none',
          outline: 'none',
          margin: 10,
          caretColor: 'gray',
          color: textColor,
        }}
      >
      </input>
      <Box padding='$5' display={'flex'}>
        <Button 
          size="xs" 
          isLoading={props.isLoading ?? false}
          intent="secondary"
          disabled={props.isLoading ?? false}
          onClick={() => {submitInput()}}
        >
          <SearchIcon width={15} height={15} color={textColor}/>
        </Button>
      </Box>
    </DefaultBorderedBox>
  );
}
