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
  Omit<MuiListItemProps, "secondaryAction"> & {
    avatar?: ReactNode;
    Icon?: ElementType;
    ListItemButtonProps?: ListItemButtonProps<ElementType>;
    ListItemTextProps?: ListItemTextProps;
  };

type ListItemCheckboxProps = Pick<BaseProps, "className"> &
  ListItemProps & {
    CheckboxProps?: CheckboxProps;
  };

export const ListItem = styled(
  ({
    avatar,
    children,
    Icon,
    ListItemButtonProps = {},
    ListItemTextProps,
    ...props
  }: ListItemProps) => {
    const { loading } = useLoading();
    const { disabled, ...ListItemButtonPropsFiltered } = ListItemButtonProps;

    return (
      <MuiListItem
        disablePadding
        secondaryAction={
          Icon ? (
            <Icon className={loading.active || ListItemButtonProps?.disabled ? "disabled" : ""} />
          ) : undefined
        }
        {...props}
      >
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
  ${({ theme }) => `
    align-items: flex-start;

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

ListItemCheckbox.displayName = "ListItemCheckbox";
