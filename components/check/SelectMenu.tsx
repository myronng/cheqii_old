import { Button } from "@mui/material";
import { FloatingMenu, FloatingMenuActionProps } from "components/check/FloatingMenu";
import { Select, SelectProps } from "components/check/Select";
import { BaseProps } from "declarations";
import { FocusEventHandler, forwardRef, useState } from "react";

export type SelectMenuProps = Pick<BaseProps, "className"> & {
  actions: FloatingMenuActionProps[];
  SelectProps: SelectProps;
};

export const SelectMenu = forwardRef<HTMLSelectElement, SelectMenuProps>((props, ref) => {
  const [open, setOpen] = useState<HTMLSelectElement | null>(null);
  const { onBlur, onFocus, ...defaultSelectProps } = props.SelectProps;

  const handleBlur: FocusEventHandler<HTMLSelectElement> = (e) => {
    setOpen(null);
    if (typeof onBlur === "function") {
      onBlur(e);
    }
  };

  const handleFocus: FocusEventHandler<HTMLSelectElement> = (e) => {
    setOpen(e.target);
    if (typeof onFocus === "function") {
      onFocus(e);
    }
  };

  return (
    <>
      <Select
        {...defaultSelectProps}
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
