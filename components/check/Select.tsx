import { styled } from "@mui/material/styles";
import { Column, Row } from "components/check/CheckDisplay";
import { togglePeripheralClasses } from "components/check/Input";
import {
  ChangeEventHandler,
  DetailedHTMLProps,
  FocusEventHandler,
  forwardRef,
  SelectHTMLAttributes,
} from "react";

export type SelectProps = DetailedHTMLProps<
  SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
> & {
  column: Column;
  options: string[];
  row: Row;
};

export const Select = styled(
  forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, column, options, row, ...props }, ref) => {
      const handleBlur: FocusEventHandler<HTMLSelectElement> = (e) => {
        togglePeripheralClasses(e, column, row);
        if (typeof props.onBlur === "function") {
          props.onBlur(e);
        }
      };

      const handleChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
        e.target.dataset.value = e.target.selectedIndex.toString();
        if (typeof props.onChange === "function") {
          props.onChange(e);
        }
      };

      const handleFocus: FocusEventHandler<HTMLSelectElement> = (e) => {
        togglePeripheralClasses(e, column, row);
        if (typeof props.onFocus === "function") {
          props.onFocus(e);
        }
      };

      return (
        <select
          {...props}
          className={`Select-root ${className}`}
          data-column={column}
          data-row={row}
          data-value={props.defaultValue}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          ref={ref}
        >
          {options.map((option, index) => (
            <option className="Select-option" key={index} value={index}>
              {option}
            </option>
          ))}
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

    &:not(:disabled) {
      color: currentColor;
      cursor: pointer;

      &:not(.selected) {
        &.focused {
          background: ${theme.palette.action.focus};
        }

        &.peripheral {
          background: ${theme.palette.action.hover};
        }
      }

      &.selected {
        background: ${theme.palette.action.selected};
        outline: 2px solid ${theme.palette.primary.main};
      }
    }

    & .Select-option {
      background: ${theme.palette.background.paper};
    }
  `}
`;
