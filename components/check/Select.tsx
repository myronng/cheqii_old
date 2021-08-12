import { ButtonBase, ButtonBaseProps, Menu, MenuItem, MenuProps } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { StyledProps } from "declarations";
import { MouseEvent, MouseEventHandler, useState } from "react";

export type MenuItemClickHandler = (event: MouseEvent<HTMLLIElement>, index: number) => void;

export type SelectProps = StyledProps & {
  ButtonProps?: ButtonBaseProps;
  defaultValue?: number;
  MenuProps?: MenuProps;
  options: string[];
};

export const Select = styled((props: SelectProps) => {
  const [anchorEl, setAnchorEl] = useState(null as HTMLButtonElement | null);
  const [selected, setSelected] = useState(props.defaultValue || 0);
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
  };

  return (
    <>
      <ButtonBase className={props.className} {...props.ButtonProps} onClick={handleButtonClick}>
        {props.options[selected]}
      </ButtonBase>
      <Menu anchorEl={anchorEl} onClose={handleMenuClose} open={menuOpen}>
        {props.options.map((option, index) => (
          <MenuItem
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
    border-radius: ${theme.shape.borderRadius}px;
    font: inherit;
    padding: ${theme.spacing(0.5, 1)};
  `}
`;
