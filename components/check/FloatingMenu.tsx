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
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

type AnchorElement = HTMLElement | null;

export type FloatingMenuOption = ButtonProps & {
  label: string;
  id: string;
};

export type FloatingMenuHandle = {
  getRoot: () => HTMLDivElement | null;
  setAnchor: (target: AnchorElement) => void;
  setOptions: (options: FloatingMenuOption[]) => void;
};

export type FloatingMenuProps = PaperProps &
  Pick<BaseProps, "className"> & {
    PopperProps?: Omit<PopperPropsType, "open">;
  };

export const FloatingMenu = styled(
  forwardRef<FloatingMenuHandle, FloatingMenuProps>(({ PopperProps, ...props }, ref) => {
    const [anchor, setAnchor] = useState<AnchorElement>(null);
    const [options, setOptions] = useState<FloatingMenuOption[]>([]);
    const rootRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => ({
      getRoot: () => rootRef.current,
      setAnchor,
      setOptions,
    }));

    return (
      <Popper
        anchorEl={anchor}
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
        open={Boolean(anchor)}
        placement="top"
        {...PopperProps}
      >
        <Paper {...props} className={`FloatingMenu-root ${props.className}`} ref={rootRef}>
          {options.map(({ id, label, ...optionProps }) => (
            <Button key={id} {...optionProps}>
              {label}
            </Button>
          ))}
        </Paper>
      </Popper>
    );
  })
)`
  display: inline-flex;
  overflow: hidden;

  & .MuiButton-root {
    border-radius: 0;
  }
`;

FloatingMenu.displayName = "FloatingMenu";
