import { styled } from "@mui/material/styles";
import { Column, Focus, Row, SetFocus } from "components/check/CheckDisplay";
import {
  ChangeEventHandler,
  DetailedHTMLProps,
  FocusEventHandler,
  SelectHTMLAttributes,
} from "react";

export type SelectProps = DetailedHTMLProps<
  SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
> & {
  column: Column;
  focus: Focus;
  options: string[];
  row: Row;
  setFocus: SetFocus;
};

export const Select = styled(
  ({ className, column, focus, options, row, setFocus, ...props }: SelectProps) => {
    let isFocused = "",
      isSelected = "";
    if (focus) {
      if (focus.selected?.id === props.id) {
        isSelected = "selected";
      }
      if (focus.column === column && focus.row === row) {
        isFocused = "focused";
      } else if (focus.column === column || focus.row === row) {
        isFocused = "peripheral";
      }
    }

    const handleBlur: FocusEventHandler<HTMLSelectElement> = () => {
      setFocus({
        ...focus,
        column: null,
        row: null,
      });
    };

    const handleChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
      e.target.dataset.value = e.target.selectedIndex.toString();
      if (typeof props.onChange === "function") {
        props.onChange(e);
      }
    };

    const handleFocus: FocusEventHandler<HTMLSelectElement> = (e) => {
      setFocus({
        column: column,
        row: row,
        selected: e.target,
      });
      if (typeof props.onFocus === "function") {
        props.onFocus(e);
      }
    };

    return (
      <select
        {...props}
        className={`Select-root ${className} ${isFocused} ${isSelected}`}
        data-value={props.defaultValue}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
      >
        {options.map((option, index) => (
          <option className="Select-option" key={index} value={index}>
            {option}
          </option>
        ))}
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
