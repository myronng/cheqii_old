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
import { Edit, EditOff, Star } from "@material-ui/icons";
import { UserAvatar } from "components/UserAvatar";
import { ValidateForm, ValidateTextField } from "components/ValidateForm";
import { BaseProps, CheckUser, User } from "declarations";
import { useAuth } from "utilities/AuthContextProvider";

export type ShareDialogProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    editors?: CheckUser[];
    owners: CheckUser[];
    viewers?: CheckUser[];
  };

type ShareUser = User & {
  access: CheckUserAccess;
};

type CheckUserAccess = number;

const USER_ACCESS_RANK: {
  [key: number]: {
    icon: any;
    label: "owner" | "editor" | "viewer";
  };
} = {
  0: {
    icon: Star,
    label: "owner",
  },
  1: {
    icon: Edit,
    label: "editor",
  },
  2: {
    icon: EditOff,
    label: "viewer",
  },
};

export const ShareDialog = styled((props: ShareDialogProps) => {
  const currentUserInfo = useAuth();
  const allUsers: ShareUser[] = [];
  let currentUserAccess: CheckUserAccess;
  Object.entries(props.owners).reduce((acc, user) => {
    if (currentUserInfo.uid === user[0]) {
      currentUserAccess = 0;
    }
    acc.push({
      access: 0,
      uid: user[0],
      ...user[1],
    });
    return acc;
  }, allUsers);
  if (typeof props.editors !== "undefined") {
    Object.entries(props.editors).reduce((acc, user) => {
      if (currentUserInfo.uid === user[0]) {
        currentUserAccess = 1;
      }
      acc.push({
        access: 1,
        uid: user[0],
        ...user[1],
      });
      return acc;
    }, allUsers);
  }
  if (typeof props.viewers !== "undefined") {
    Object.entries(props.viewers).reduce((acc, user) => {
      if (currentUserInfo.uid === user[0]) {
        currentUserAccess = 2;
      }
      acc.push({
        access: 2,
        uid: user[0],
        ...user[1],
      });
      return acc;
    }, allUsers);
  }
  console.log(allUsers);
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
            fullWidth
            label={props.strings["email"]}
            type="email"
          />
          <List className="ShareDialog-list">
            {allUsers.map((user) => {
              let renderListItem;
              if (currentUserAccess <= user.access) {
                renderListItem = (
                  <ListItemButton>
                    <ListItemAvatar>
                      <UserAvatar
                        displayName={user.displayName}
                        email={user.email}
                        photoURL={user.photoURL}
                        strings={props.strings}
                      />
                    </ListItemAvatar>
                    <ListItemText primary={user.displayName} secondary={user.email} />
                  </ListItemButton>
                );
              } else {
                renderListItem = (
                  <>
                    <ListItemAvatar>
                      <UserAvatar
                        displayName={user.displayName}
                        email={user.email}
                        photoURL={user.photoURL}
                        strings={props.strings}
                      />
                    </ListItemAvatar>
                    <ListItemText primary={user.displayName} secondary={user.email} />;
                  </>
                );
              }
              const Icon = USER_ACCESS_RANK[user.access].icon;
              return (
                <ListItem key={user.uid} secondaryAction={<Icon />}>
                  {renderListItem}
                </ListItem>
              );
            })}
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

      & .MuiListItemSecondaryAction-root {
        pointer-events: none;

        .MuiSvgIcon-root {
          display: block;
        }
      }
    }
  `}
`;
