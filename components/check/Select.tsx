import { ButtonBase, ButtonBaseProps, Menu, MenuItem, MenuProps } from "@material-ui/core";
import { styled, useTheme } from "@material-ui/core/styles";
import { StyledProps } from "declarations";
import { MouseEvent, MouseEventHandler, useState } from "react";

export type MenuItemClickHandler = (event: MouseEvent<HTMLLIElement>, index: number) => void;

export type SelectProps = StyledProps & {
  ButtonProps?: ButtonBaseProps;
  defaultValue?: number;
  id?: string;
  MenuProps?: MenuProps;
  onChange?: (index: number) => void;
  options: string[];
};

export const Select = styled((props: SelectProps) => {
  const [anchorEl, setAnchorEl] = useState(null as HTMLButtonElement | null);
  const [selected, setSelected] = useState(props.defaultValue || 0);
  const theme = useTheme();
  const menuOpen = Boolean(anchorEl);

  const handleButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick: MenuItemClickHandler = (_e, index) => {
    setSelected(index);
    handleMenuClose();
    if (typeof props.onChange === "function") {
      props.onChange(index);
    }
  };

  return (
    <>
      <ButtonBase
        {...props.ButtonProps}
        className={`Select-root ${props.className}`}
        id={props.id}
        onClick={handleButtonClick}
        style={{
          minWidth: `calc(${props.options[selected].length}ch + ${theme.spacing(2)} + 1px)`,
        }}
      >
        {props.options[selected]}
      </ButtonBase>
      <Menu anchorEl={anchorEl} className="Select-menu" onClose={handleMenuClose} open={menuOpen}>
        {props.options.map((option, index) => (
          <MenuItem
            className="Select-menuItem"
            disabled={selected === index}
            key={index}
            onClick={(e) => handleMenuItemClick(e, index)}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
})`
  ${({ theme }) => `
    font: inherit;
    height: 100%;
    padding: ${theme.spacing(0.5, 1)};
    width: 100%;
  `}
`;
