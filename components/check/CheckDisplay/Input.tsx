import { styled, useTheme } from "@mui/material/styles";
import {
  DetailedHTMLProps,
  FocusEventHandler,
  InputHTMLAttributes,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

export type InputProps = DetailedHTMLProps<
  Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue">,
  HTMLInputElement
>;

export const Input = styled(
  memo(({ className, value, ...props }: InputProps) => {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      if (typeof props.onBlur === "function") {
        props.onBlur(e);
      }
      setFocused(false);
    };

    const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
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
  })
)`
  ${({ theme }) => `
    appearance: none;
    background: none;
    border: 0;
    font: inherit;
    height: 100%;
    padding: ${theme.spacing(1, 2)};
    text-align: inherit;
    width: 100%;

    &:disabled {
      color: ${theme.palette.text.disabled};
    }

    &:hover {
      background: ${theme.palette.action.hover};
    }

    &:not(:disabled) {
      color: currentColor;
    }
  `}
`;

Input.displayName = "Input";
