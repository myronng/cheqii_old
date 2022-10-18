import { darken, lighten, styled, useTheme } from "@mui/material/styles";
import {
  Dispatch,
  FocusEvent,
  InputHTMLAttributes,
  memo,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onBlur" | "onFocus" | "value"
> & {
  onBlur?: (
    event: FocusEvent<HTMLInputElement>,
    setValue: Dispatch<SetStateAction<InputProps["defaultValue"]>>,
    isDirty: boolean
  ) => void;
  onFocus?: (
    event: FocusEvent<HTMLInputElement>,
    setValue: Dispatch<SetStateAction<InputProps["defaultValue"]>>,
    isDirty: boolean
  ) => void;
};

const InputUnstyled = memo(
  ({ className, defaultValue, onBlur, onChange, onFocus, ...props }: InputProps) => {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);
    const [value, setValue] = useState(defaultValue);
    const cleanValue = useRef(value);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleBlur: InputHTMLAttributes<HTMLInputElement>["onBlur"] = (e) => {
      if (typeof onBlur === "function") {
        onBlur(e, setValue, cleanValue.current !== value);
      }
      cleanValue.current = value;
      setFocused(false);
    };

    const handleChange: InputProps["onChange"] = (e) => {
      if (typeof onChange === "function") {
        onChange(e);
      }
      setValue(e.target.value);
    };

    const handleFocus: InputHTMLAttributes<HTMLInputElement>["onFocus"] = (e) => {
      if (typeof onFocus === "function") {
        onFocus(e, setValue, cleanValue.current !== value);
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
        onChange={handleChange}
        onFocus={handleFocus}
        ref={inputRef}
        style={{
          minWidth: `calc(${value?.toString().length || 0}ch + ${theme.spacing(4)} + 1px)`,
        }}
        value={value}
      />
    );
  }
);

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

    &:focus {
      background: ${
        theme.palette.mode === "dark"
          ? lighten(theme.palette.background.secondary!, theme.palette.action.activatedOpacity)
          : darken(theme.palette.background.secondary!, theme.palette.action.activatedOpacity)
      };
      // Use lighten/darken to prevent transparent background
      outline: 2px solid ${theme.palette.primary.main};
      outline-offset: -2px;
    }

    &:not(:disabled) {
      color: currentColor;

      &:hover:not(:focus) {
        background: ${
          theme.palette.mode === "dark"
            ? lighten(theme.palette.background.secondary!, theme.palette.action.focusOpacity)
            : darken(theme.palette.background.secondary!, theme.palette.action.focusOpacity)
        };
        // Use selectedOpacity in favor of theme.palette.action.hoverOpacity because of Grid-alternate styling
        // Use lighten/darken to prevent transparent background
      }
    }

    &:invalid {
      color: ${theme.palette.action.disabled};
    }
  `}
`;

Input.displayName = "Input";
InputUnstyled.displayName = "InputUnstyled";
