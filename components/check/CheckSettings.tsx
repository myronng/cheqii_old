import {
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  TextField,
} from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { ContentCopy, Edit, EditOff, Star } from "@material-ui/icons";
import { Dialog, DialogProps } from "components/Dialog";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps, CheckUser, User } from "declarations";
import { FocusEventHandler } from "react";
import { useAuth } from "utilities/AuthContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckSettingsProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    editors?: CheckUser[];
    owners?: CheckUser[];
    checkUrl: string;
    viewers?: CheckUser[];
  };

type CheckSettingsUser = User & {
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

export const CheckSettings = styled((props: CheckSettingsProps) => {
  const currentUserInfo = useAuth();
  const { setSnackbar } = useSnackbar();
  const allUsers: CheckSettingsUser[] = [];
  let currentUserAccess: CheckUserAccess;
  if (typeof props.owners !== "undefined") {
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
  }
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

  const handleCopyClick = () => {
    navigator.clipboard.writeText(props.checkUrl);
    setSnackbar({
      active: true,
      message: props.strings["linkCopied"],
      type: "success",
    });
  };

  const handleUrlFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    e.target.select();
  };

  return (
    <Dialog
      className={`CheckSettings-root ${props.className}`}
      dialogTitle={props.strings["settings"]}
      fullWidth
      maxWidth="sm"
      onClose={props.onClose}
      open={props.open}
    >
      <div className="CheckSettings-link">
        <TextField
          className="CheckSettings-linkUrl"
          fullWidth
          inputProps={{ readOnly: true }}
          onFocus={handleUrlFocus}
          size="small"
          type="url"
          value={props.checkUrl}
        />
        <IconButton className="CheckSettings-linkCopy" onClick={handleCopyClick}>
          <ContentCopy />
        </IconButton>
      </div>
      <List className="CheckSettings-list">
        {allUsers.map((user) => {
          const Icon = USER_ACCESS_RANK[user.access].icon;
          const isDisabled =
            currentUserAccess >= user.access &&
            user.access !== 0 &&
            user.uid !== currentUserInfo.uid;
          return (
            <ListItem
              key={user.uid}
              secondaryAction={
                <Icon
                  className={`${USER_ACCESS_RANK[user.access].label} ${
                    isDisabled ? "disabled" : ""
                  }`}
                />
              }
            >
              <ListItemButton disabled={isDisabled}>
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
            </ListItem>
          );
        })}
      </List>
    </Dialog>
  );
})`
  ${({ theme }) => `
    & .CheckSettings-link {
      display: flex;
      margin-top: ${theme.spacing(1)};
    }

    & .CheckSettings-linkCopy {
      margin-left: auto;
    }

    & .CheckSettings-linkUrl {
      margin-right: ${theme.spacing(1)};

      & .MuiInputBase-input {
        text-overflow: ellipsis;
      }
    }

    & .CheckSettings-list {
      & .MuiListItem-root {
        padding: 0;
      }

      & .MuiListItemButton-root {
        border-radius: ${theme.shape.borderRadius}px;
        overflow: hidden;
        padding-left: ${theme.spacing(1)};
      }

      & .MuiListItemSecondaryAction-root {
        pointer-events: none;

        & .MuiSvgIcon-root {
          display: block;

          &.disabled {
            opacity: ${theme.palette.action.disabledOpacity};
          }

          &.editor {
            fill: ${theme.palette.text.primary};
          }

          &.owner {
            fill: ${theme.palette.secondary.main};
          }

          &.viewer {
            fill: ${theme.palette.text.disabled};
          }
        }
      }
    }
  `}
`;
