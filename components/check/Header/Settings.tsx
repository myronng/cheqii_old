import {
  Block,
  Check as CheckIcon,
  Close,
  Edit,
  EditOff,
  Lock,
  LockOpen,
  Share,
  Star,
  SvgIconComponent,
} from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import {
  Collapse,
  IconButton,
  List,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuProps,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonProps,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { ShareClickHandler } from "components/check";
import { Dialog, DialogProps } from "components/Dialog";
import { redirect } from "components/Link";
import { ListItem, ListItemMenu } from "components/List";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { UserAvatar } from "components/UserAvatar";
import { AccessType, BaseProps, CheckSettings, User } from "declarations";
import { arrayRemove, deleteField, doc, updateDoc, writeBatch } from "firebase/firestore";
import { Dispatch, FocusEventHandler, MouseEventHandler, SetStateAction, useState } from "react";
import { db, generateUid } from "services/firebase";

export type SettingsProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    accessLink: string;
    checkId: string;
    checkSettings: CheckSettings;
    onShareClick: ShareClickHandler;
    setSettings: Dispatch<SetStateAction<CheckSettings>>;
    unsubscribe: () => void;
    userAccess: number;
    writeAccess: boolean;
  };

type SettingsUser = Pick<User, "displayName" | "email" | "photoURL" | "uid"> & {
  access: SettingsProps["userAccess"];
};

export type InviteType = {
  id: AccessType;
  primary: string;
  secondary: string;
};

const INVITE_TYPE: InviteType[] = [
  {
    id: "editor",
    primary: "inviteAsEditor",
    secondary: "inviteAsEditorHint",
  },
  {
    id: "viewer",
    primary: "inviteAsViewer",
    secondary: "inviteAsViewerHint",
  },
];

const USER_ACCESS_RANK: {
  Icon: SvgIconComponent;
  id: AccessType;
}[] = [
  {
    Icon: Star,
    id: "owner",
  },
  {
    Icon: Edit,
    id: "editor",
  },
  {
    Icon: EditOff,
    id: "viewer",
  },
];

export const Settings = styled((props: SettingsProps) => {
  const { userInfo: currentUserInfo } = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [inviteTypeMenu, setInviteTypeMenu] = useState<HTMLElement | null>(null);
  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
  const [selectedUserIndex, setSelectedUserIndex] = useState(-1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const allUsers: SettingsUser[] = [];
  const owners = Object.entries(props.checkSettings.owner);
  const isLastOwner = owners.length <= 1;
  const currentInviteType =
    INVITE_TYPE.find((invite) => invite.id === props.checkSettings.invite.type) || INVITE_TYPE[0];

  if (typeof props.checkSettings.owner !== "undefined") {
    owners.reduce((acc, user) => {
      acc.push({
        access: 0,
        uid: user[0],
        ...user[1],
      });
      return acc;
    }, allUsers);
  }
  if (typeof props.checkSettings.editor !== "undefined") {
    Object.entries(props.checkSettings.editor).reduce((acc, user) => {
      acc.push({
        access: 1,
        uid: user[0],
        ...user[1],
      });
      return acc;
    }, allUsers);
  }
  if (typeof props.checkSettings.viewer !== "undefined") {
    Object.entries(props.checkSettings.viewer).reduce((acc, user) => {
      acc.push({
        access: 2,
        uid: user[0],
        ...user[1],
      });
      return acc;
    }, allUsers);
  }
  const selectedUser = allUsers[selectedUserIndex];

  const handleDeleteCheckClick: MouseEventHandler<HTMLButtonElement> = () => {
    setConfirmDelete(true);
  };

  const handleDeleteCheckCancelClick: MouseEventHandler<HTMLButtonElement> = () => {
    setConfirmDelete(false);
  };

  const handleDeleteCheckConfirmClick: MouseEventHandler<HTMLButtonElement> = async () => {
    try {
      if (props.writeAccess) {
        setLoading({
          active: true,
        });
        setConfirmDelete(false);
        if (typeof currentUserInfo.uid !== "undefined") {
          const newSettings = { ...props.checkSettings };
          delete newSettings[USER_ACCESS_RANK[props.userAccess].id][currentUserInfo.uid];
          props.unsubscribe();
          if (props.userAccess === 0) {
            // Use admin to perform deletes that affects multiple user documents in DB
            const response = await fetch(`/api/check/${props.checkId}`, {
              method: "DELETE",
            });
            if (response.ok) {
              redirect(setLoading, "/");
            }
          } else {
            // Non-owners can only leave the check; no admin usage required
            const batch = writeBatch(db);
            const checkDoc = doc(db, "checks", props.checkId);
            batch.update(doc(db, "users", currentUserInfo.uid), {
              checks: arrayRemove(checkDoc),
            });
            batch.update(checkDoc, {
              ...newSettings,
              updatedAt: Date.now(),
            });
            await batch.commit();
            redirect(setLoading, "/");
          }
        }
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      setLoading({
        active: false,
      });
    }
  };

  const handleInviteTypeChange: ToggleButtonProps["onChange"] = async (_e, newRestricted) => {
    try {
      if (props.writeAccess) {
        const stateSettings = { ...props.checkSettings };
        stateSettings.invite.required = newRestricted;

        const checkDoc = doc(db, "checks", props.checkId);
        updateDoc(checkDoc, {
          "invite.required": newRestricted, // Only update the single node instead of sending the entire stateCheckData
          updatedAt: Date.now(),
        });

        props.setSettings(stateSettings);
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    }
  };

  const handleInviteTypeMenuClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setInviteTypeMenu(e.currentTarget);
  };

  const handleInviteTypeMenuClose: MenuProps["onClose"] = () => {
    setInviteTypeMenu(null);
  };

  const handleRegenerateInviteClick: MouseEventHandler<HTMLButtonElement> = async () => {
    try {
      if (props.writeAccess) {
        const newInviteId = generateUid();
        const stateSettings = { ...props.checkSettings };
        stateSettings.invite.id = newInviteId;

        const checkDoc = doc(db, "checks", props.checkId);
        updateDoc(checkDoc, {
          "invite.id": newInviteId,
          updatedAt: Date.now(),
        });

        props.setSettings(stateSettings);
        setSnackbar({
          active: true,
          autoHideDuration: 3500,
          message: props.strings["inviteLinkRegenerated"],
          type: "success",
        });
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    }
  };

  const handleRemoveUserClick: MouseEventHandler<HTMLLIElement> = async (_e) => {
    try {
      if (props.writeAccess) {
        setLoading({
          active: true,
        });
        handleUserMenuClose();
        // Use admin to perform deletes that affects other user documents in DB
        if (typeof selectedUser !== "undefined" && typeof selectedUser.uid !== "undefined") {
          await fetch(`/api/check/${props.checkId}/user/${selectedUser.uid}`, {
            method: "DELETE",
          });
        }
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({
        active: false,
      });
    }
  };

  const handleUrlFocus: FocusEventHandler<HTMLInputElement> = (e) => {
    e.target.select();
  };

  const handleUserMenuClose = () => {
    setUserMenu(null);
  };

  const renderInviteTypeMenuOptions = INVITE_TYPE.map((invite) => {
    const handleInviteTypeClick: MouseEventHandler<HTMLButtonElement> = async () => {
      try {
        setInviteTypeMenu(null);
        if (props.writeAccess) {
          const stateSettings = { ...props.checkSettings };
          stateSettings.invite.type = invite.id;

          const checkDoc = doc(db, "checks", props.checkId);
          // Don't await update, allow user interaction immediately
          updateDoc(checkDoc, {
            "invite.type": invite.id,
            updatedAt: Date.now(),
          });

          props.setSettings(stateSettings);
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    };

    return (
      <ListItem
        key={invite.id}
        ListItemButtonProps={{
          onClick: handleInviteTypeClick,
          selected: props.checkSettings.invite.type === invite.id,
        }}
        ListItemTextProps={{
          primary: props.strings[invite.primary],
          secondary: props.strings[invite.secondary],
        }}
      />
    );
  });

  const renderUserMenuOptions = USER_ACCESS_RANK.map((userAccess, index) => {
    const Icon = userAccess.Icon;
    const selectedUserAccess = selectedUser?.access;
    const isDisabled =
      loading.active ||
      index === selectedUserAccess || // Prevent re-selecting own access level for self
      props.userAccess > selectedUserAccess || // Prevent changing access level for higher level users
      props.userAccess > index || // Prevent changing access level to anything higher than own level
      (selectedUser?.uid === currentUserInfo.uid && isLastOwner); // Otherwise if selector is owner, then must not be the last owner

    const handleUserAccessClick: MouseEventHandler<HTMLLIElement> = (_e) => {
      try {
        if (
          props.writeAccess &&
          typeof selectedUser !== "undefined" &&
          typeof selectedUser.uid !== "undefined"
        ) {
          const currentUid = selectedUser.uid;
          const currentAccess = USER_ACCESS_RANK[selectedUserAccess].id;
          const currentUserData = props.checkSettings[currentAccess][currentUid];
          const newAccess = userAccess.id;
          const newSettings = { ...props.checkSettings };
          newSettings[newAccess][currentUid] = currentUserData;
          delete newSettings[currentAccess][currentUid];
          props.setSettings(newSettings);
          const checkDoc = doc(db, "checks", props.checkId);
          updateDoc(checkDoc, {
            [`${currentAccess}.${currentUid}`]: deleteField(),
            [`${newAccess}.${currentUid}`]: currentUserData,
            updatedAt: Date.now(),
          });
        }
        handleUserMenuClose();
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    };

    return (
      <MenuItem
        disabled={isDisabled}
        key={userAccess.id}
        onClick={handleUserAccessClick}
        selected={USER_ACCESS_RANK[selectedUserAccess]?.id === userAccess.id}
      >
        <ListItemIcon>
          <Icon className={isDisabled ? "disabled" : ""} fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={props.strings[userAccess.id]} />
      </MenuItem>
    );
  });

  if (selectedUser?.uid !== currentUserInfo.uid && props.userAccess === 0) {
    const isDisabled = loading.active || (selectedUser?.access === 0 && isLastOwner);
    renderUserMenuOptions.push(
      <MenuItem
        className="Settings-dangerous"
        disabled={isDisabled}
        key={renderUserMenuOptions.length}
        onClick={handleRemoveUserClick}
      >
        <ListItemIcon>
          <Block className={isDisabled ? "disabled" : ""} fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={props.strings["remove"]} />
      </MenuItem>
    );
  }

  return (
    <Dialog
      className={`Settings-root ${props.className}`}
      dialogTitle={props.strings["settings"]}
      fullWidth
      maxWidth="sm"
      onClose={props.onClose}
      open={props.open}
    >
      <ToggleButtonGroup
        className="SettingsRestriction-root"
        disabled={loading.active || !props.writeAccess}
        exclusive
        onChange={handleInviteTypeChange}
        size="large"
        value={props.checkSettings.invite.required}
      >
        <ToggleButton color="primary" value={true}>
          <Lock />
          <Typography component="h3" variant="h4">
            {props.strings["restricted"]}
          </Typography>
          <Typography className="SettingsRestriction-description" component="span" variant="body2">
            {props.strings["restrictedDescription"]}
          </Typography>
        </ToggleButton>
        <ToggleButton color="warning" value={false}>
          <LockOpen />
          <Typography component="h3" variant="h4">
            {props.strings["open"]}
          </Typography>
          <Typography className="SettingsRestriction-description" component="span" variant="body2">
            {props.strings["openDescription"]}
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
      <div className="SettingsLink-root">
        <TextField
          className="SettingsLink-url"
          disabled={loading.active}
          inputProps={{ readOnly: true }}
          onFocus={handleUrlFocus}
          size="small"
          type="url"
          value={props.accessLink}
        />
        <IconButton
          className="SettingsLink-share"
          disabled={loading.active}
          onClick={props.onShareClick}
        >
          <Share />
        </IconButton>
      </div>
      <Collapse className="SettingsRestricted-root" in={props.checkSettings.invite.required}>
        <section className="SettingsInvites-root SettingsSection-root">
          <Typography className="SettingsSection-heading" variant="h3">
            {props.strings["invites"]}
          </Typography>
          <List className="SettingsInvites-type SettingsSection-list" disablePadding>
            <ListItemMenu
              ListItemButtonProps={{
                disabled: !props.writeAccess,
                onClick: handleInviteTypeMenuClick,
              }}
              ListItemTextProps={{
                primary: props.strings[currentInviteType.primary],
                secondary: props.strings[currentInviteType.secondary],
              }}
            />
            <ListItem
              className="SettingsInvites-regenerate"
              ListItemButtonProps={{
                disabled: !props.writeAccess,
                onClick: handleRegenerateInviteClick,
              }}
              ListItemTextProps={{
                primary: props.strings["regenerateInviteLink"],
                secondary: props.strings["regenerateInviteWarning"],
              }}
            />
          </List>
          <Menu
            anchorEl={inviteTypeMenu}
            onClose={handleInviteTypeMenuClose}
            open={Boolean(inviteTypeMenu)}
          >
            {renderInviteTypeMenuOptions}
          </Menu>
        </section>
        <section className="SettingsSection-root SettingsUsers-root">
          <Typography className="SettingsSection-heading" variant="h3">
            {props.strings["users"]}
          </Typography>
          <List className="SettingsSection-list" disablePadding>
            {allUsers.map((user, userIndex) => {
              let primaryText = props.strings["anonymous"];
              let secondaryText: string | undefined;
              if (user.displayName) {
                primaryText = user.displayName;
                if (user.email) {
                  secondaryText = user.email;
                }
              } else if (user.email) {
                primaryText = user.email;
              }
              const Icon = USER_ACCESS_RANK[user.access].Icon;
              const isDisabled =
                loading.active || // Disabled when loading
                (props.userAccess > user.access && // Prevent selecting a user if they are higher level
                  props.userAccess !== 0 && // And if the selector isn't an owner
                  user.uid !== currentUserInfo.uid); // And only if the selected user isn't self

              const handleUserMenuClick: MouseEventHandler<HTMLButtonElement> = (e) => {
                setUserMenu(e.currentTarget);
                setSelectedUserIndex(userIndex);
              };

              return (
                <ListItemMenu
                  avatar={
                    <UserAvatar
                      alt={user.displayName ?? user.email ?? undefined}
                      src={user.photoURL}
                      strings={props.strings}
                    />
                  }
                  key={`${user.access}-${user.uid}`}
                  ListItemButtonProps={{
                    disabled: isDisabled,
                    onClick: handleUserMenuClick,
                  }}
                  ListItemTextProps={{
                    primary: primaryText,
                    secondary: secondaryText,
                  }}
                  secondaryAction={<Icon className={isDisabled ? "disabled" : ""} />}
                />
              );
            })}
          </List>
        </section>
        <Menu
          anchorEl={userMenu}
          className={`Settings-menu ${props.className}`}
          onClose={handleUserMenuClose}
          open={Boolean(userMenu)}
        >
          {renderUserMenuOptions}
        </Menu>
      </Collapse>
      <div className="SettingsDelete-root">
        <Collapse in={!confirmDelete} orientation="horizontal">
          <LoadingButton
            color="error"
            disabled={loading.active}
            id="checkSettingsDelete"
            onClick={handleDeleteCheckClick}
          >
            {props.strings[props.userAccess === 0 ? "deleteCheck" : "leaveCheck"]}
          </LoadingButton>
        </Collapse>
        <Collapse in={confirmDelete} orientation="horizontal">
          <div className="SettingsDelete-confirm">
            <Typography variant="body1">
              {props.strings[props.userAccess === 0 ? "deleteThisCheck" : "leaveThisCheck"]}
            </Typography>
            <IconButton onClick={handleDeleteCheckCancelClick}>
              <Close />
            </IconButton>
            <IconButton color="error" onClick={handleDeleteCheckConfirmClick}>
              <CheckIcon />
            </IconButton>
          </div>
        </Collapse>
      </div>
    </Dialog>
  );
})`
  ${({ theme }) => `
    &.Settings-root {
      & .MuiDialogContent-root {
        display: flex;
        flex-direction: column;
        gap: ${theme.spacing(2)};
      }

      & .SettingsDelete-root {
        display: flex;
        white-space: nowrap;

        & .SettingsDelete-confirm {
          align-items: center;
          display: flex;
          gap: ${theme.spacing(1)};
        }
      }

      & .SettingsInvites-regenerate .MuiListItemText-primary {
        color: ${theme.palette.warning.main};
      }

      & .SettingsLink-root {
        display: flex;
        gap: ${theme.spacing(1)};

        & .SettingsLink-share {
          margin-left: auto;
        }

        & .SettingsLink-url {
          // Use flex: 1; instead of fullWidth prop to balance multiple <IconButton> widths
          flex: 1;

          & .MuiInputBase-input {
            text-overflow: ellipsis;
          }
        }
      }

      & .SettingsRestricted-root .MuiCollapse-wrapperInner {
        display: flex;
        flex-direction: column;
        gap: ${theme.spacing(2)};
      }

      & .SettingsRestriction-root {
        display: flex;
        gap: ${theme.spacing(2)};
        justify-content: center;

        & .MuiToggleButtonGroup-grouped {
          border-radius: ${theme.shape.borderRadius}px;
          display: flex;
          flex: 1;
          flex-direction: column;

          &:not(:first-of-type) {
            border-left-color: ${theme.palette.divider};
          }

          & .SettingsRestriction-description {
            color: ${theme.palette.text.secondary};
            text-align: left;
          }
        }
      }

      & .SettingsSection-root {
        background: ${theme.palette.action.hover};
        border-radius: ${theme.shape.borderRadius}px;
        overflow: hidden;

        & .SettingsSection-heading {
          font-weight: 700;
          padding: ${theme.spacing(2, 2, 1, 2)};
        }
      }
    }

    &.Settings-menu {
      & .MuiListItem-root {
        padding: 0;
        width: 100%;
      }

      & .Settings-dangerous {
        border-top: 2px solid ${theme.palette.divider};
        color: ${theme.palette.error.main};

        & .MuiListItemIcon-root {
          color: inherit;
        }
      }
    }
  `}
`;

Settings.displayName = "Settings";
