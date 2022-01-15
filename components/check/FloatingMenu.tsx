import {
  ButtonProps,
  Paper,
  PaperProps,
  Popper,
  PopperProps as PopperPropsType,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseProps } from "declarations";
import { Children } from "react";

export type FloatingMenuActionProps = ButtonProps & {
  label: string;
  id: string;
};

export type FloatingMenuProps = Pick<BaseProps, "children" | "className"> & {
  PaperProps?: PaperProps;
  PopperProps: PopperPropsType;
};

export const FloatingMenu = styled((props: FloatingMenuProps) => (
  <Popper
    modifiers={[
      {
        name: "offset",
        options: {
          offset: [0, 16],
        },
      },
    ]}
    placement="top"
    {...props.PopperProps}
  >
    <Paper {...props.PaperProps} className={`FloatingMenu-root ${props.className}`}>
      {props.children}
    </Paper>
  </Popper>
))`
  ${({ children, theme }) => `
    display: grid;
    grid-gap: ${theme.spacing(1)};
    grid-template-columns: repeat(${Children.count(children)}, auto);
  `}
`;
