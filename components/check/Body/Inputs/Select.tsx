import { darken, lighten, styled } from "@mui/material/styles";
import { FocusEvent, SelectHTMLAttributes, useRef, useState } from "react";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onBlur"> & {
  onBlur?: (event: FocusEvent<HTMLSelectElement>, isDirty: boolean) => void;
};

export const Select = styled(
  ({ children, className, defaultValue, onBlur, onChange, ...props }: SelectProps) => {
    const [value, setValue] = useState(defaultValue);
    const cleanValue = useRef(value);

    const handleBlur: SelectHTMLAttributes<HTMLSelectElement>["onBlur"] = (e) => {
      if (typeof onBlur === "function") {
        onBlur(e, cleanValue.current !== value);
      }
      cleanValue.current = value;
    };

    const handleChange: SelectProps["onChange"] = (e) => {
      if (typeof onChange === "function") {
        onChange(e);
      }
      setValue(e.target.value);
    };

    return (
      <select
        {...props}
        className={`Select-root ${className}`}
        onBlur={handleBlur}
        onChange={handleChange}
        value={value}
      >
        {children}
      </select>
    );
  }
)`
  ${({ theme }) => `
    appearance: none;
    background: none;
    border: 0;
    font: inherit;
    height: 100%;
    min-width: 100%; // Required for dynamic name resizing
    padding: ${theme.spacing(0, 2)};
    text-align: inherit;

    &:disabled {
      color: ${theme.palette.text.disabled};
      opacity: 1;
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
      cursor: pointer;

      &:hover:not(:focus) {
        background: ${
          theme.palette.mode === "dark"
            ? lighten(theme.palette.background.secondary!, theme.palette.action.focusOpacity)
            : darken(theme.palette.background.secondary!, theme.palette.action.focusOpacity)
        };
        // Use lighten/darken to prevent transparent background
      }
    }

    & option {
      background: ${theme.palette.background.paper};
    }
  `}
`;

Select.displayName = "Select";
