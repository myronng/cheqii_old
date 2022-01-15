import { Button } from "@mui/material";
import { FloatingMenu, FloatingMenuActionProps } from "components/check/FloatingMenu";
import { Input, InputProps as InputPropsType } from "components/check/Input";
import { BaseProps } from "declarations";
import { FocusEventHandler, forwardRef, useState } from "react";

export type InputMenuProps = Pick<BaseProps, "className"> & {
  actions: FloatingMenuActionProps[];
  InputProps: InputPropsType;
};

export const InputMenu = forwardRef<HTMLInputElement, InputMenuProps>((props, ref) => {
  const [open, setOpen] = useState<HTMLInputElement | null>(null);
  const { onBlur, onFocus, ...defaultInputProps } = props.InputProps;

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    setOpen(null);
    if (typeof onBlur === "function") {
      onBlur(e);
    }
  };

  const handleFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    setOpen(e.target);
    if (typeof onFocus === "function") {
      onFocus(e);
    }
  };

  return (
    <>
      <Input
        {...defaultInputProps}
        className={props.className}
        onBlur={handleBlur}
        onFocus={handleFocus}
        ref={ref}
      />
      <FloatingMenu
        PopperProps={{
          anchorEl: open,
          open: Boolean(open),
        }}
      >
        {props.actions.map(({ id, label, ...actionButtonProps }) => (
          <Button key={id} {...actionButtonProps}>
            {label}
          </Button>
        ))}
      </FloatingMenu>
    </>
  );
});
