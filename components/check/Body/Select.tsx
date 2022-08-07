import { styled } from "@mui/material/styles";
import {
  Children,
  cloneElement,
  FocusEvent,
  isValidElement,
  SelectHTMLAttributes,
  useRef,
} from "react";

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "onBlur"> & {
  onBlur?: (event: FocusEvent<HTMLSelectElement>, isDirty: boolean) => void;
};

export const Select = styled(({ children, className, value, ...props }: SelectProps) => {
  const cleanValue = useRef(value);

  const handleBlur: SelectHTMLAttributes<HTMLSelectElement>["onBlur"] = (e) => {
    if (typeof props.onBlur === "function") {
      props.onBlur(e, cleanValue.current !== value);
    }
    cleanValue.current = value;
  };

  const renderChildren = Children.map(children, (child) =>
    isValidElement(child)
      ? cloneElement(child, {
          className: `Select-option ${child.props.className}}`,
        })
      : null
  );

  return (
    <select {...props} className={`Select-root ${className}`} onBlur={handleBlur} value={value}>
      {renderChildren}
    </select>
  );
})`
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

    &:hover {
      background: ${theme.palette.action.hover};
    }

    &:not(:disabled) {
      color: currentColor;
      cursor: pointer;
    }

    & .Select-option {
      background: ${theme.palette.background.paper};
    }
  `}
`;

Select.displayName = "Select";
