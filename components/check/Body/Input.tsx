import { styled, useTheme } from "@mui/material/styles";
import { FocusEvent, InputHTMLAttributes, memo, useEffect, useRef, useState } from "react";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onBlur"> & {
  onBlur?: (event: FocusEvent<HTMLInputElement>, isDirty: boolean) => void;
};

const InputUnstyled = memo(({ className, value, ...props }: InputProps) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const cleanValue = useRef(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur: InputHTMLAttributes<HTMLInputElement>["onBlur"] = (e) => {
    if (typeof props.onBlur === "function") {
      props.onBlur(e, cleanValue.current !== value);
    }
    cleanValue.current = value;
    setFocused(false);
  };

  const handleFocus: InputProps["onFocus"] = (e) => {
    if (typeof props.onFocus === "function") {
      props.onFocus(e);
    }
    // Set state after onFocus in case state changes aren't grouped properly (should be fixed in React 18)
    setFocused(true);
  };

  useEffect(() => {
    if (focused) {
      // Do this in useEffect to execute after any onFocus formatting
      inputRef.current?.select();
    }
  }, [focused]);

  return (
    <input
      {...props}
      className={`Input-root ${className}`}
      onBlur={handleBlur}
      onFocus={handleFocus}
      ref={inputRef}
      style={{
        minWidth: `calc(${value?.toString().length || 0}ch + ${theme.spacing(4)} + 1px)`,
      }}
      value={value}
    />
  );
});

export const Input = styled(InputUnstyled)`
  ${({ theme }) => `
    appearance: none;
    background: none;
    border: 0;
    font: inherit;
    height: 100%;
    padding: ${theme.spacing(1, 2)};
    width: 100%;

    &:disabled {
      color: ${theme.palette.text.disabled};
    }

    &:not(:disabled) {
      color: currentColor;

      &:hover {
        background: ${theme.palette.action.hover};
      }
    }
  `}
`;

Input.displayName = "Input";
InputUnstyled.displayName = "InputUnstyled";
