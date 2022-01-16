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
  root: HTMLDivElement | null;
  setAnchor: (target: AnchorElement) => void;
  setOptions: (options: FloatingMenuOption[]) => void;
};

export type FloatingMenuProps = Pick<BaseProps, "className"> & {
  PaperProps?: PaperProps;
  PopperProps?: Omit<PopperPropsType, "open">;
};

export const FloatingMenu = styled(
  forwardRef((props: FloatingMenuProps, ref) => {
    const [anchor, setAnchor] = useState<AnchorElement>(null);
    const [options, setOptions] = useState<FloatingMenuOption[]>([]);
    const rootRef = useRef<FloatingMenuHandle["root"]>(null);
    useImperativeHandle(
      ref,
      (): FloatingMenuHandle => ({
        root: rootRef.current,
        setAnchor: (target) => {
          setAnchor(target);
        },
        setOptions: (options) => {
          setOptions(options);
        },
      })
    );

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
        ]}
        open={Boolean(anchor)}
        placement="top"
        {...props.PopperProps}
      >
        <Paper
          {...props.PaperProps}
          className={`FloatingMenu-root ${props.className}`}
          ref={rootRef}
        >
          {options.map(({ id, label, ...actionButtonProps }) => (
            <Button key={id} {...actionButtonProps}>
              {label}
            </Button>
          ))}
        </Paper>
      </Popper>
    );
  })
)`
  ${({ theme }) => `
    display: inline-flex;
    gap: ${theme.spacing(1)};
  `}
`;
