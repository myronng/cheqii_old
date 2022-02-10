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

type AnchorElement = HTMLElement | null;

export type FloatingMenuOption = ButtonProps & {
  label: string;
  id: string;
};

export type FloatingMenuProps = PaperProps &
  Pick<BaseProps, "className"> & {
    options?: FloatingMenuOption[];
    PopperProps: Omit<PopperPropsType, "open">;
  };

export const FloatingMenu = styled(({ options, PopperProps, ...props }: FloatingMenuProps) => (
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
    placement="top"
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
))`
  display: inline-flex;
  overflow: hidden;

  & .MuiButton-root {
    border-radius: 0;
  }
`;

FloatingMenu.displayName = "FloatingMenu";
