import { styled } from "@mui/material/styles";
import { Column, Row } from "components/check/CheckDisplay";
import {
  ChangeEventHandler,
  Children,
  cloneElement,
  DetailedHTMLProps,
  forwardRef,
  isValidElement,
  SelectHTMLAttributes,
} from "react";

export type SelectProps = DetailedHTMLProps<
  SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
> & {
  column: Column;
  row: Row;
};

export const Select = styled(
  forwardRef<HTMLSelectElement, SelectProps>(
    ({ children, className, column, row, ...props }, ref) => {
      const renderChildren = Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child, {
              className: `Select-option ${child.props.className}}`,
            })
          : null
      );

      const handleChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
        e.target.dataset.value = e.target.selectedIndex.toString();
        if (typeof props.onChange === "function") {
          props.onChange(e);
        }
      };

      return (
        <select
          {...props}
          className={`Select-root ${className}`}
          data-column={column}
          data-row={row}
          data-value={props.defaultValue}
          onChange={handleChange}
          ref={ref}
        >
          {renderChildren}
        </select>
      );
    }
  )
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
