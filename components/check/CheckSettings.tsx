import {
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Block, Check, Close, ContentCopy, Edit, EditOff, Star } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Dialog, DialogProps } from "components/Dialog";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps, CheckUsers, User } from "declarations";
import { FocusEventHandler, MouseEvent, MouseEventHandler, useState } from "react";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckSettingsProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    checkUrl: string;
    onCheckDelete: () => void;
    onUserAccessChange: (
      event: MouseEvent<HTMLButtonElement>,
      uid: NonNullable<User["uid"]>,
      currentAccess: AccessType,
      newAccess: AccessType
    ) => void;
    onUserAccessDelete: (
      event: MouseEvent<HTMLButtonElement>,
      uid: NonNullable<User["uid"]>,
      currentAccess: AccessType
    ) => void;
    onUserAccessSave: () => void;
    users: CheckSettingsUsers;
  };

type CheckSettingsUser = User & {
  access: CheckUserAccess;
};

export type CheckSettingsUsers = {
  [key in AccessType]: CheckUsers;
};

type CheckUserAccess = number;

const USER_ACCESS_RANK: {
  [key: number]: {
    icon: any;
    id: AccessType;
  };
} = {
  0: {
    icon: Star,
    id: "owner",
  },
  1: {
    icon: Edit,
    id: "editor",
  },
  2: {
    icon: EditOff,
    id: "viewer",
  },
};

type AccessType = "owner" | "editor" | "viewer";

export const CheckSettings = styled((props: CheckSettingsProps) => {
  const currentUserInfo = useAuth();
  const { loading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
  const [selectedUserIndex, setSelectedUserIndex] = useState(-1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const userMenuOpen = Boolean(userMenu);
  const allUsers: CheckSettingsUser[] = [];
  const userAccesses = Object.entries(USER_ACCESS_RANK);
  const owners = Object.entries(props.users.owner);
  const isLastOwner = owners.length <= 1;
  let currentUserAccess: CheckUserAccess = userAccesses.length - 1; // Start at lowest access until verified

  if (typeof props.users.owner !== "undefined") {
    owners.reduce((acc, user) => {
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
  if (typeof props.users.editor !== "undefined") {
    Object.entries(props.users.editor).reduce((acc, user) => {
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
  if (typeof props.users.viewer !== "undefined") {
    Object.entries(props.users.viewer).reduce((acc, user) => {
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

  const selectedUser = allUsers[selectedUserIndex];

  const handleCopyClick = () => {
    navigator.clipboard.writeText(props.checkUrl);
    setSnackbar({
      active: true,
      autoHideDuration: 2000,
      message: props.strings["linkCopied"],
      type: "success",
    });
  };

  const handleDialogSaveClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    props.onUserAccessSave();
    if (typeof props.onClose === "function") {
      props.onClose(e, "actionClick");
    }
  };

  const handleDeleteCheckClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
    setConfirmDelete(true);
  };

  const handleDeleteCheckCancelClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
    setConfirmDelete(false);
  };

  const handleDeleteCheckConfirmClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
    setConfirmDelete(false);
    props.onCheckDelete();
  };

  const handleRemoveUserClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (typeof selectedUser !== "undefined" && typeof selectedUser.uid !== "undefined") {
      props.onUserAccessDelete(e, selectedUser.uid, USER_ACCESS_RANK[selectedUser.access].id);
    }
    handleUserMenuClose();
  };

  const handleUrlFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    e.target.select();
  };

  const handleUserMenuClose = () => {
    setUserMenu(null);
  };

  const renderDeleteCheckButton =
    currentUserAccess === 0 ? (
      <div className="CheckSettingsDelete-root">
        <Collapse in={!confirmDelete} orientation="horizontal">
          <LoadingButton
            color="error"
            disabled={loading.active}
            id="checkSettingsDelete"
            onClick={handleDeleteCheckClick}
          >
            {props.strings["deleteCheck"]}
          </LoadingButton>
        </Collapse>
        <Collapse in={confirmDelete} orientation="horizontal">
          <div className="CheckSettingsDelete-confirm">
            <Typography variant="body2">{props.strings["deleteThisCheck"]}</Typography>
            <IconButton onClick={handleDeleteCheckCancelClick}>
              <Close />
            </IconButton>
            <IconButton color="error" onClick={handleDeleteCheckConfirmClick}>
              <Check />
            </IconButton>
          </div>
        </Collapse>
      </div>
    ) : undefined;

  const renderUserMenuOptions = userAccesses.map((userAccess, index) => {
    const Icon = userAccess[1].icon;
    const selectedUserAccess = selectedUser?.access;
    const isDisabled =
      loading.active ||
      index === selectedUserAccess || // Prevent re-selecting own access level for self
      currentUserAccess > selectedUserAccess || // Prevent changing access level for higher level users
      currentUserAccess > index || // Prevent changing access level to anything higher than own level
      (currentUserAccess === 0 && isLastOwner); // Otherwise if selector is owner, then must not be the last owner;

    const handleUserAccessClick: MouseEventHandler<HTMLButtonElement> = (e) => {
      if (typeof selectedUser !== "undefined" && typeof selectedUser.uid !== "undefined") {
        props.onUserAccessChange(
          e,
          selectedUser.uid,
          USER_ACCESS_RANK[selectedUser.access].id,
          USER_ACCESS_RANK[index].id
        );
        handleUserMenuClose();
      }
    };
    return (
      <ListItem
        key={userAccess[0]}
        secondaryAction={<Icon className={isDisabled ? "disabled" : ""} />}
      >
        <ListItemButton component="button" disabled={isDisabled} onClick={handleUserAccessClick}>
          <ListItemText primary={props.strings[userAccess[1].id]} />
        </ListItemButton>
      </ListItem>
    );
  });

  if (selectedUser?.uid === currentUserInfo.uid || currentUserAccess === 0) {
    const optionLabel =
      selectedUser?.uid === currentUserInfo.uid
        ? props.strings["abandon"]
        : props.strings["remove"];
    const isDisabled = loading.active || (selectedUser?.access === 0 && isLastOwner);
    renderUserMenuOptions.push(
      <ListItem
        className="CheckSettings-dangerous"
        key={renderUserMenuOptions.length}
        secondaryAction={<Block className={isDisabled ? "disabled" : ""} />}
      >
        <ListItemButton component="button" disabled={isDisabled} onClick={handleRemoveUserClick}>
          <ListItemText primary={optionLabel} />
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <Dialog
      className={`CheckSettings-root ${props.className}`}
      dialogActions={
        <>
          {renderDeleteCheckButton}
          <LoadingButton
            className="CheckSettingsSave-root"
            disabled={loading.active}
            id="checkSettingsSave"
            loading={loading.queue.includes("checkSettingsSave")}
            onClick={handleDialogSaveClick}
            variant="contained"
          >
            {props.strings["save"]}
          </LoadingButton>
        </>
      }
      dialogTitle={props.strings["settings"]}
      fullWidth
      maxWidth="sm"
      onClose={props.onClose}
      open={props.open}
    >
      <div className="CheckSettingsLink-root">
        <TextField
          className="CheckSettingsLink-url"
          disabled={loading.active}
          fullWidth
          inputProps={{ readOnly: true }}
          onFocus={handleUrlFocus}
          size="small"
          type="url"
          value={props.checkUrl}
        />
        <IconButton
          className="CheckSettingsLink-copy"
          disabled={loading.active}
          onClick={handleCopyClick}
        >
          <ContentCopy />
        </IconButton>
      </div>
      <List className="CheckSettingsList-root">
        {allUsers.map((user, userIndex) => {
          const Icon = USER_ACCESS_RANK[user.access].icon;
          const isDisabled =
            loading.active || // Disabled when loading
            (currentUserAccess >= user.access && // Prevent selecting a user if they are higher or equal level
              currentUserAccess !== 0 && // And if the selector isn't an owner or
              user.uid !== currentUserInfo.uid); // And only if the selected user isn't self

          const handleUserMenuClick: MouseEventHandler<HTMLButtonElement> = (e) => {
            setUserMenu(e.currentTarget);
            setSelectedUserIndex(userIndex);
          };
          return (
            <ListItem
              key={user.uid}
              secondaryAction={<Icon className={isDisabled ? "disabled" : ""} />}
            >
              <ListItemButton
                component="button"
                disabled={isDisabled}
                onClick={handleUserMenuClick}
              >
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
      <Menu
        anchorEl={userMenu}
        className={`CheckSettings-menu ${props.className}`}
        onClose={handleUserMenuClose}
        open={userMenuOpen}
      >
        {renderUserMenuOptions}
      </Menu>
    </Dialog>
  );
})`
  ${({ theme }) => `
    &.CheckSettings-root {
      & .CheckSettingsDelete-root {
        display: flex;
        margin-right: auto;
        white-space: nowrap;
      }

      & .CheckSettingsDelete-confirm {
        align-items: center;
        display: flex;

        & .MuiIconButton-root {
          margin-left: ${theme.spacing(1)};
        }
      }

      & .CheckSettingsLink-root {
        display: flex;
        margin-top: ${theme.spacing(1)};
      }

      & .CheckSettingsLink-copy {
        margin-left: auto;
      }

      & .CheckSettingsLink-url {
        margin-right: ${theme.spacing(1)};

        & .MuiInputBase-input {
          text-overflow: ellipsis;
        }
      }

      & .CheckSettingsList-root {
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
          }
        }
      }

      & .CheckSettingsSave-root {
        margin-left: ${theme.spacing(2)};
      }
    }

    &.CheckSettings-menu {
      & .MuiListItem-root {
        padding: 0;
        width: 100%;
      }

      & .MuiListItemSecondaryAction-root {
        pointer-events: none;

        & .MuiSvgIcon-root {
          display: block;

          &.disabled {
            opacity: ${theme.palette.action.disabledOpacity};
          }
        }
      }

      & .CheckSettings-dangerous {
        border-top: 2px solid ${theme.palette.divider};
        color: ${theme.palette.error.main};
      }
    }
  `}
`;
