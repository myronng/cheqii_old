import {
  Block,
  Check,
  Close,
  Edit,
  EditOff,
  ExpandMore,
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
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Dialog, DialogProps } from "components/Dialog";
import { redirect } from "components/Link";
import { UserAvatar } from "components/UserAvatar";
import { AccessType, BaseProps, Check as CheckType, Metadata, User } from "declarations";
import { arrayRemove, doc, updateDoc, writeBatch } from "firebase/firestore";
import { CheckUsers } from "pages/check/[checkId]";
import { Dispatch, FocusEventHandler, MouseEventHandler, SetStateAction, useState } from "react";
import { db } from "services/firebase";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckSettingsProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    accessLink: string;
    check: CheckType;
    inviteId: string;
    inviteType: AccessType;
    metadata: Metadata;
    onRegenerateInviteLinkClick?: () => string;
    onRestrictionChange?: (value: boolean) => void;
    onShareClick: () => void;
    restricted: boolean;
    setInviteType: Dispatch<SetStateAction<AccessType>>;
    setUsers: Dispatch<SetStateAction<CheckUsers>>;
    unsubscribe: (() => void) | undefined;
    userAccess: number;
    users: CheckUsers;
    writeAccess: boolean;
  };

type CheckSettingsUser = User & {
  access: CheckSettingsProps["userAccess"];
};

const INVITE_TYPE: {
  id: AccessType;
  primary: string;
  secondary: string;
}[] = [
  {
    id: "viewer",
    primary: "inviteAsViewer",
    secondary: "newUsersView",
  },
  {
    id: "editor",
    primary: "inviteAsEditor",
    secondary: "newUsersEdit",
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

export const CheckSettings = styled((props: CheckSettingsProps) => {
  const currentUserInfo = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [inviteTypeMenu, setInviteTypeMenu] = useState<HTMLElement | null>(null);
  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
  const [selectedUserIndex, setSelectedUserIndex] = useState(-1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const allUsers: CheckSettingsUser[] = [];
  const owners = Object.entries(props.users.owner);
  const isLastOwner = owners.length <= 1;
  const currentInviteType =
    INVITE_TYPE.find((invite) => invite.id === props.inviteType) || INVITE_TYPE[0];

  if (typeof props.users.owner !== "undefined") {
    owners.reduce((acc, user) => {
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
      acc.push({
        access: 2,
        uid: user[0],
        ...user[1],
      });
      return acc;
    }, allUsers);
  }
  const selectedUser = allUsers[selectedUserIndex];

  const handleDeleteCheckClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
    setConfirmDelete(true);
  };

  const handleDeleteCheckCancelClick: MouseEventHandler<HTMLButtonElement> = (_e) => {
    setConfirmDelete(false);
  };

  const handleDeleteCheckConfirmClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
    try {
      setLoading({
        active: true,
        id: "checkSettingsDelete",
      });
      if (typeof props.unsubscribe === "function") {
        props.unsubscribe();
      }
      setConfirmDelete(false);
      if (props.userAccess === 0) {
        // Use admin to perform deletes that affects multiple user documents in DB
        const response = await fetch(`/api/check/${props.metadata.id}`, {
          method: "DELETE",
        });
        if (response.status === 200) {
          redirect(setLoading, "/");
        }
      } else {
        // Non-owners can only leave the check; no admin usage required
        const batch = writeBatch(db);
        if (typeof currentUserInfo.uid !== "undefined") {
          const newUsers = { ...props.users };
          delete newUsers[USER_ACCESS_RANK[props.userAccess].id][currentUserInfo.uid];
          props.setUsers(newUsers);

          const checkDoc = doc(db, "checks", props.metadata.id);
          batch.update(doc(db, "users", currentUserInfo.uid), {
            checks: arrayRemove(checkDoc),
          });
          batch.update(checkDoc, newUsers);
        }
        await batch.commit();
        redirect(setLoading, "/");
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      setLoading({
        active: false,
        id: "checkSettingsDelete",
      });
    }
  };

  const handleInviteTypeMenuClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setInviteTypeMenu(e.currentTarget);
  };

  const handleInviteTypeMenuClose = () => {
    setInviteTypeMenu(null);
  };

  const handleRemoveUserClick: MouseEventHandler<HTMLLIElement> = async (_e) => {
    try {
      setLoading({
        active: true,
        id: "checkSettingsRemoveUser",
      });
      // Use admin to perform deletes that affects other user documents in DB
      if (typeof selectedUser !== "undefined" && typeof selectedUser.uid !== "undefined") {
        await fetch(`/api/check/${props.metadata.id}/user/${selectedUser.uid}`, {
          method: "DELETE",
        });
      }
      handleUserMenuClose();
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({
        active: false,
        id: "checkSettingsRemoveUser",
      });
    }
  };

  const handleRegenerateInviteLinkClick = async () => {
    try {
      if (props.writeAccess && typeof props.onRegenerateInviteLinkClick === "function") {
        const inviteId = props.onRegenerateInviteLinkClick();
        const newCheck = { ...props.check };
        newCheck.invite.id = inviteId;
        const checkDoc = doc(db, "checks", props.metadata.id);
        updateDoc(checkDoc, newCheck);
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    }
  };

  const handleRestrictionChange: ToggleButtonGroupProps["onChange"] = async (_e, value) => {
    try {
      if (props.writeAccess && typeof props.onRestrictionChange === "function") {
        props.onRestrictionChange(value);
        const newCheck = { ...props.check };
        newCheck.invite.required = value;
        const checkDoc = doc(db, "checks", props.metadata.id);
        updateDoc(checkDoc, newCheck);
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
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
    const handleInviteTypeClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
      try {
        handleInviteTypeMenuClose();
        if (props.writeAccess) {
          props.setInviteType(invite.id);
          const newCheck = { ...props.check };
          newCheck.invite.type = invite.id;
          // Don't await update, allow user interaction immediately
          const checkDoc = doc(db, "checks", props.metadata.id);
          updateDoc(checkDoc, newCheck);
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
      <ListItem disablePadding key={invite.id}>
        <ListItemButton
          component="button"
          onClick={handleInviteTypeClick}
          selected={props.inviteType === invite.id}
        >
          <ListItemText
            primary={props.strings[invite.primary]}
            secondary={props.strings[invite.secondary]}
          />
        </ListItemButton>
      </ListItem>
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
      if (typeof selectedUser !== "undefined" && typeof selectedUser.uid !== "undefined") {
        const currentUid = selectedUser.uid;
        const currentAccess = USER_ACCESS_RANK[selectedUserAccess].id;
        const newAccess = userAccess.id;
        const newUsers = { ...props.users };
        const newUserAccess = newUsers[newAccess];
        const currentUserAccess = newUsers[currentAccess][currentUid];
        if (typeof newUserAccess !== "undefined") {
          newUserAccess[currentUid] = currentUserAccess;
        } else {
          newUsers[newAccess] = {
            [currentUid]: currentUserAccess,
          };
        }
        delete newUsers[currentAccess][currentUid];
        props.setUsers(newUsers);
        const newCheck = { ...props.check, ...newUsers };
        const checkDoc = doc(db, "checks", props.metadata.id);
        updateDoc(checkDoc, newCheck);
        handleUserMenuClose();
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
        className="CheckSettings-dangerous"
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
      className={`CheckSettings-root ${props.className}`}
      dialogTitle={props.strings["settings"]}
      fullWidth
      maxWidth="sm"
      onClose={props.onClose}
      open={props.open}
    >
      <ToggleButtonGroup
        className="CheckSettingsRestriction-root"
        disabled={loading.active || !props.writeAccess}
        exclusive
        onChange={handleRestrictionChange}
        size="large"
        value={props.restricted}
      >
        <ToggleButton color="primary" value={true}>
          <Lock />
          <Typography component="h3" variant="h4">
            {props.strings["restricted"]}
          </Typography>
          <Typography
            className="CheckSettingsRestriction-description"
            component="span"
            variant="body2"
          >
            {props.strings["restrictedDescription"]}
          </Typography>
        </ToggleButton>
        <ToggleButton color="warning" value={false}>
          <LockOpen />
          <Typography component="h3" variant="h4">
            {props.strings["open"]}
          </Typography>
          <Typography
            className="CheckSettingsRestriction-description"
            component="span"
            variant="body2"
          >
            {props.strings["openDescription"]}
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
      <div className="CheckSettingsLink-root">
        <TextField
          className="CheckSettingsLink-url"
          disabled={loading.active}
          inputProps={{ readOnly: true }}
          onFocus={handleUrlFocus}
          size="small"
          type="url"
          value={props.accessLink}
        />
        <IconButton
          className="CheckSettingsLink-share"
          disabled={loading.active}
          onClick={props.onShareClick}
        >
          <Share />
        </IconButton>
      </div>
      <Collapse in={props.restricted}>
        <section className="CheckSettingsInvites-root CheckSettingsSection-root">
          <Typography className="CheckSettingsSection-heading" variant="h3">
            {props.strings["invites"]}
          </Typography>
          <List className="CheckSettingsInvites-type CheckSettingsSection-list" disablePadding>
            <ListItem
              disablePadding
              secondaryAction={
                <ExpandMore className={loading.active || !props.writeAccess ? "disabled" : ""} />
              }
            >
              <ListItemButton
                component="button"
                disabled={loading.active || !props.writeAccess}
                onClick={handleInviteTypeMenuClick}
              >
                <ListItemText
                  primary={props.strings[currentInviteType.primary]}
                  secondary={props.strings[currentInviteType.secondary]}
                />
              </ListItemButton>
            </ListItem>
            <ListItem className="CheckSettingsInvites-regenerate" disablePadding>
              <ListItemButton
                component="button"
                disabled={loading.active || !props.writeAccess}
                onClick={handleRegenerateInviteLinkClick}
              >
                <ListItemText
                  primary={props.strings["regenerateInviteLink"]}
                  secondary={props.strings["regenerateInviteWarning"]}
                />
              </ListItemButton>
            </ListItem>
          </List>
          <Menu
            anchorEl={inviteTypeMenu}
            onClose={handleInviteTypeMenuClose}
            open={Boolean(inviteTypeMenu)}
          >
            {renderInviteTypeMenuOptions}
          </Menu>
        </section>
        <section className="CheckSettingsSection-root CheckSettingsUsers-root">
          <Typography className="CheckSettingsSection-heading" variant="h3">
            {props.strings["users"]}
          </Typography>
          <List className="CheckSettingsSection-list" disablePadding>
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
                <ListItem
                  disablePadding
                  key={`${user.access}-${user.uid}`}
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
                    <ListItemText primary={primaryText} secondary={secondaryText} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </section>
        <Menu
          anchorEl={userMenu}
          className={`CheckSettings-menu ${props.className}`}
          onClose={handleUserMenuClose}
          open={Boolean(userMenu)}
        >
          {renderUserMenuOptions}
        </Menu>
      </Collapse>
      <div className="CheckSettingsDelete-root">
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
          <div className="CheckSettingsDelete-confirm">
            <Typography variant="body1">
              {props.strings[props.userAccess === 0 ? "deleteThisCheck" : "leaveThisCheck"]}
            </Typography>
            <IconButton onClick={handleDeleteCheckCancelClick}>
              <Close />
            </IconButton>
            <IconButton color="error" onClick={handleDeleteCheckConfirmClick}>
              <Check />
            </IconButton>
          </div>
        </Collapse>
      </div>
    </Dialog>
  );
})`
  ${({ theme }) => `
    &.CheckSettings-root {
      & .CheckSettingsDelete-root {
        display: flex;
        margin-top: ${theme.spacing(2)};
        white-space: nowrap;

        & .CheckSettingsDelete-confirm {
          align-items: center;
          display: flex;

          & .MuiIconButton-root {
            margin-left: ${theme.spacing(1)};
          }
        }
      }

      & .CheckSettingsInvites-regenerate .MuiListItemText-primary {
        color: ${theme.palette.warning.main};
      }

      & .CheckSettingsLink-root {
        display: flex;
        margin: ${theme.spacing(2, 0)};

        & .CheckSettingsLink-share {
          margin-left: auto;
          margin-right: ${theme.spacing(1)};
        }

        & .CheckSettingsLink-url {
          // Use flex: 1; instead of fullWidth prop to balance multiple <IconButton> widths
          flex: 1;
          margin-right: ${theme.spacing(1)};

          & .MuiInputBase-input {
            text-overflow: ellipsis;
          }
        }
      }

      & .CheckSettingsRestriction-root {
        display: flex;
        justify-content: center;

        & .MuiToggleButtonGroup-grouped {
          display: flex;
          flex: 1;
          flex-direction: column;

          &:not(:first-of-type) {
            border-left-color: ${theme.palette.divider};
            border-radius: ${theme.shape.borderRadius}px;
            margin-left: ${theme.spacing(2)};
          }

          &:not(:last-of-type) {
            border-radius: ${theme.shape.borderRadius}px;
          }

          & .CheckSettingsRestriction-description {
            color: ${theme.palette.text.secondary};
            text-align: left;
          }
        }
      }

      & .CheckSettingsSection-root {
        background: ${theme.palette.action.hover};
        border-radius: ${theme.shape.borderRadius}px;
        overflow: hidden;

        &:not(:first-of-type) {
          margin-top: ${theme.spacing(2)};
        }

        & .CheckSettingsSection-heading {
          font-weight: 700;
          padding: ${theme.spacing(2, 2, 1, 2)};
        }


        & .CheckSettingsSection-list {
          & .MuiListItemButton-root {
            overflow: hidden;

            & .MuiListItemText-root .MuiTypography-root {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

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
        }
      }
    }

    &.CheckSettings-menu {
      & .MuiListItem-root {
        padding: 0;
        width: 100%;
      }

      & .CheckSettings-dangerous {
        border-top: 2px solid ${theme.palette.divider};
        color: ${theme.palette.error.main};

        & .MuiListItemIcon-root {
          color: inherit;
        }
      }
    }
  `}
`;
