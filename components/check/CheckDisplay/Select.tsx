import { styled } from "@mui/material/styles";
import {
  Children,
  cloneElement,
  DetailedHTMLProps,
  isValidElement,
  SelectHTMLAttributes,
} from "react";

export type SelectProps = DetailedHTMLProps<
  SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
>;

export const Select = styled(({ children, className, ...props }: SelectProps) => {
  const renderChildren = Children.map(children, (child) =>
    isValidElement(child)
      ? cloneElement(child, {
          className: `Select-option ${child.props.className}}`,
        })
      : null
  );

  return (
    <select {...props} className={`Select-root ${className}`}>
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
