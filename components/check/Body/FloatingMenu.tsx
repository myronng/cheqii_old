import {
  Button,
  ButtonProps,
  Paper,
  PaperProps,
  Popper,
  PopperProps as PopperPropsType,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseProps } from "declarations";
import { memo } from "react";

export type FloatingMenuOption = ButtonProps & {
  label: string;
  id: string;
};

export type FloatingMenuProps = PaperProps &
  Pick<BaseProps, "className"> & {
    options?: FloatingMenuOption[];
    PopperProps: Omit<PopperPropsType, "open">;
  };

const FloatingMenuUnstyled = memo(({ options, PopperProps, ...props }: FloatingMenuProps) => (
  <Popper
    disablePortal
    modifiers={[
      {
        name: "offset",
        options: {
          offset: [0, 16],
        },
      },
      {
        name: "preventOverflow",
        options: {
          padding: 16,
        },
      },
    ]}
    open={Boolean(PopperProps.anchorEl)}
    placement="bottom" // Don't overlap with mobile flyouts
    popperOptions={{
      strategy: "fixed", // Required to not overflow <HTML>; boundary doesn't work
    }}
    {...PopperProps}
  >
    <Paper {...props} className={`FloatingMenu-root ${props.className}`}>
      {options?.map(({ id, label, ...optionProps }) => (
        <Button key={id} {...optionProps}>
          {label}
        </Button>
      ))}
    </Paper>
  </Popper>
));

export const FloatingMenu = styled(FloatingMenuUnstyled)`
  display: inline-flex;
  overflow: hidden;

  & .MuiButton-root {
    border-radius: 0;
  }
`;

FloatingMenu.displayName = "FloatingMenu";
FloatingMenuUnstyled.displayName = "FloatingMenuUnstyled";
