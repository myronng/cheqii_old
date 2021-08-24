import {
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { UserAvatar } from "components/UserAvatar";
import { ValidateForm, ValidateTextField } from "components/ValidateForm";
import { BaseProps } from "declarations";

export type ShareDialogProps = Pick<BaseProps, "className" | "strings"> & DialogProps;

export const ShareDialog = styled((props: ShareDialogProps) => {
  return (
    <Dialog
      className={`ShareDialog-root ${props.className}`}
      onClose={props.onClose}
      open={props.open}
    >
      <DialogTitle className="ShareDialog-title">{props.strings["share"]}</DialogTitle>
      <DialogContent className="ShareDialog-content">
        <ValidateForm className="ShareDialog-form">
          <ValidateTextField
            className="ShareDialog-email"
            label={props.strings["email"]}
            type="email"
          />
          <List className="ShareDialog-list">
            <ListItem>
              <ListItemButton>
                <ListItemAvatar>
                  <UserAvatar />
                </ListItemAvatar>
                <ListItemText />
              </ListItemButton>
            </ListItem>
            <ListItem>
              <ListItemButton>
                <ListItemAvatar>
                  <UserAvatar />
                </ListItemAvatar>
                <ListItemText />
              </ListItemButton>
            </ListItem>
          </List>
        </ValidateForm>
      </DialogContent>
    </Dialog>
  );
})`
  ${({ theme }) => `
    & .ShareDialog-form {
      padding-top: ${theme.spacing(1)};
    }

    & .ShareDialog-list {
      & .MuiListItem-root {
        padding: 0;
      }

      & .MuiListItemButton-root {
        border-radius: ${theme.shape.borderRadius}px;
        overflow: hidden;
      }
    }
  `}
`;
