import { ExpandMore } from "@mui/icons-material";
import {
  Checkbox,
  CheckboxProps,
  ListItem as MuiListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemButtonProps,
  ListItemProps as MuiListItemProps,
  ListItemText,
  ListItemTextProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLoading } from "components/LoadingContextProvider";
import { BaseProps } from "declarations";
import { ElementType, ReactNode } from "react";

type ListItemProps = Pick<BaseProps, "className"> &
  MuiListItemProps & {
    avatar?: ReactNode;
    ListItemButtonProps?: ListItemButtonProps<ElementType>;
    ListItemTextProps?: ListItemTextProps;
  };

type ListItemCheckboxProps = Pick<BaseProps, "className"> &
  ListItemProps & {
    CheckboxProps?: CheckboxProps;
  };

type ListItemMenuProps = Pick<BaseProps, "className"> & ListItemProps;

export const ListItem = styled(
  ({ avatar, children, ListItemButtonProps = {}, ListItemTextProps, ...props }: ListItemProps) => {
    const { loading } = useLoading();
    const { disabled, ...ListItemButtonPropsFiltered } = ListItemButtonProps;

    return (
      <MuiListItem disablePadding {...props}>
        <ListItemButton
          component="button"
          disabled={loading.active || disabled}
          {...ListItemButtonPropsFiltered}
        >
          {avatar && <ListItemAvatar>{avatar}</ListItemAvatar>}
          <ListItemText {...ListItemTextProps} />
          {children}
        </ListItemButton>
      </MuiListItem>
    );
  }
)`
  align-items: flex-start;
`;

export const ListItemCheckbox = styled(
  ({ CheckboxProps, ListItemButtonProps = {}, ...props }: ListItemCheckboxProps) => {
    ListItemButtonProps.component = "label";

    return (
      // Don't use secondaryAction for <Checkbox /> because it breaks label linking to descendant children
      // Changing it would require an explicit htmlFor
      <ListItem ListItemButtonProps={ListItemButtonProps} {...props}>
        <Checkbox {...CheckboxProps} />
      </ListItem>
    );
  }
)`
  ${({ theme }) => `
    position: relative;

    & .MuiCheckbox-root {
      pointer-events: none;
      position: absolute;
      right: ${theme.spacing(1)};
    }

    & .MuiListItemButton-root {
      padding-right: ${theme.spacing(6)};
    }
  `}
`;

export const ListItemMenu = styled((props: ListItemMenuProps) => {
  const { loading } = useLoading();

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <ExpandMore
          className={loading.active || props.ListItemButtonProps?.disabled ? "disabled" : ""}
        />
      }
      {...props}
    />
  );
})`
  ${({ theme }) => `
    & .MuiListItemSecondaryAction-root {
      color: ${theme.palette.action.active};
      pointer-events: none;

      & .MuiSvgIcon-root {
        display: block;

        &.disabled {
          opacity: ${theme.palette.action.disabledOpacity};
        }
      }
    }
  `}
`;

ListItemCheckbox.displayName = "ListItemCheckbox";
