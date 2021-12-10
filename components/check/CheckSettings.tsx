import {
  Block,
  Check,
  Close,
  ContentCopy,
  Edit,
  EditOff,
  Lock,
  LockOpen,
  Star,
} from "@mui/icons-material";
import {
  Collapse,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Menu,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { LoadingButton } from "@mui/lab";
import { Dialog, DialogProps } from "components/Dialog";
import { redirect } from "components/Link";
import { UserAvatar } from "components/UserAvatar";
import { ValidateTextField } from "components/ValidateForm";
import { BaseProps, CheckParsed, User } from "declarations";
import {
  arrayRemove,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { ChangeEventHandler, FocusEventHandler, MouseEventHandler, useState } from "react";
import { db } from "services/firebase";
import { interpolateString } from "services/formatter";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckSettingsProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    check: CheckParsed;
    checkUrl: string;
  };

type CheckSettingsUser = User & {
  access: CheckUserAccess;
};

type CheckUserAccess = number;

const USER_ACCESS_RANK: {
  icon: any;
  id: AccessType;
}[] = [
  {
    icon: Star,
    id: "owner",
  },
  {
    icon: Edit,
    id: "editor",
  },
  {
    icon: EditOff,
    id: "viewer",
  },
];

type AccessType = "owner" | "editor" | "viewer";

export const CheckSettings = styled((props: CheckSettingsProps) => {
  const currentUserInfo = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [newUserType, setNewUserType] = useState<AccessType>("editor");
  const [userMenu, setUserMenu] = useState<HTMLElement | null>(null);
  const [selectedUserIndex, setSelectedUserIndex] = useState(-1);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addUserValue, setAddUserValue] = useState("");
  const [restricted, setRestricted] = useState(props.check.restricted);
  const [users, setUsers] = useState({
    editor: props.check.editor || {},
    owner: props.check.owner || {},
    viewer: props.check.viewer || {},
  });
  const userMenuOpen = Boolean(userMenu);
  const allUsers: CheckSettingsUser[] = [];
  const owners = Object.entries(users.owner);
  const isLastOwner = owners.length <= 1;
  let currentUserAccess: CheckUserAccess = USER_ACCESS_RANK.length - 1; // Start at lowest access until verified

  if (typeof users.owner !== "undefined") {
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
  if (typeof users.editor !== "undefined") {
    Object.entries(users.editor).reduce((acc, user) => {
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
  if (typeof users.viewer !== "undefined") {
    Object.entries(users.viewer).reduce((acc, user) => {
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

  const handleAddUserBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    if (e.target.checkValidity()) {
      // TODO: Save email as user in Firebase; when user accesses check fill data
      setAddUserValue("");
    }
  };

  const handleAddUserChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setAddUserValue(e.target.value);
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(props.checkUrl);
    setSnackbar({
      active: true,
      autoHideDuration: 2000,
      message: props.strings["linkCopied"],
      type: "success",
    });
  };

  const handleDialogSaveClick: MouseEventHandler<HTMLButtonElement> = async (e) => {
    try {
      setLoading({
        active: true,
        id: "checkSettingsSave",
      });
      const checkDoc = doc(db, "checks", props.check.id!);
      await updateDoc(checkDoc, {
        ...users,
        restricted,
      });
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({
        active: false,
        id: "checkSettingsSave",
      });
    }
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

  const handleDeleteCheckConfirmClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
    try {
      setLoading({
        active: true,
        id: "checkSettingsDelete",
      });
      setConfirmDelete(false);
      const batch = writeBatch(db);
      const checkDoc = doc(db, "checks", props.check.id);
      const userQuery = query(collection(db, "users"), where("checks", "array-contains", checkDoc));
      const querySnapshot = await getDocs(userQuery);
      querySnapshot.forEach((userDoc) => {
        batch.update(userDoc.ref, {
          checks: arrayRemove(checkDoc),
        });
      });
      batch.delete(checkDoc);
      await batch.commit();
      redirect(setLoading, "/");
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

  const handleNewUserTypeChange: ToggleButtonGroupProps["onChange"] = (_e, value) => {
    if (value !== null) {
      setNewUserType(value);
    }
  };

  const handleRemoveUserClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (typeof selectedUser !== "undefined" && typeof selectedUser.uid !== "undefined") {
      const newUsers = { ...users };
      delete newUsers[USER_ACCESS_RANK[selectedUser.access].id][selectedUser.uid];
      setUsers(newUsers);
    }
    handleUserMenuClose();
  };

  const handleRestrictionChange: ToggleButtonGroupProps["onChange"] = (_e, value) => {
    if (value !== null) {
      setRestricted(value);
    }
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

  const renderAddUserButtons: JSX.Element[] = [];
  const renderUserMenuOptions = USER_ACCESS_RANK.map((userAccess, index) => {
    const Icon = userAccess.icon;
    const selectedUserAccess = selectedUser?.access;
    const isDisabled =
      loading.active ||
      index === selectedUserAccess || // Prevent re-selecting own access level for self
      currentUserAccess > selectedUserAccess || // Prevent changing access level for higher level users
      currentUserAccess > index || // Prevent changing access level to anything higher than own level
      (selectedUser?.uid === currentUserInfo.uid && isLastOwner); // Otherwise if selector is owner, then must not be the last owner

    const handleUserAccessClick: MouseEventHandler<HTMLButtonElement> = (e) => {
      if (typeof selectedUser !== "undefined" && typeof selectedUser.uid !== "undefined") {
        const currentUid = selectedUser.uid;
        const currentAccess = USER_ACCESS_RANK[selectedUserAccess].id;
        const newAccess = userAccess.id;
        const newUsers = { ...users };
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
        setUsers(newUsers);
        handleUserMenuClose();
      }
    };

    if (index > 0 && currentUserAccess <= 1) {
      renderAddUserButtons.push(
        <ToggleButton color="primary" key={userAccess.id} value={userAccess.id}>
          {interpolateString(props.strings["addUserType"], {
            userType: props.strings[userAccess.id],
          })}
        </ToggleButton>
      );
    }

    return (
      <ListItem
        key={userAccess.id}
        secondaryAction={<Icon className={isDisabled ? "disabled" : ""} />}
      >
        <ListItemButton component="button" disabled={isDisabled} onClick={handleUserAccessClick}>
          <ListItemText primary={props.strings[userAccess.id]} />
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
      <ToggleButtonGroup
        className="CheckSettingsRestriction-root"
        disabled={currentUserAccess !== 0}
        exclusive
        onChange={handleRestrictionChange}
        size="large"
        value={restricted}
      >
        <ToggleButton color="primary" value={true}>
          <Lock />
          <Typography>{props.strings["restricted"]}</Typography>
          <Typography className="CheckSettingsRestriction-description" variant="subtitle2">
            {props.strings["restrictedDescription"]}
          </Typography>
        </ToggleButton>
        <ToggleButton color="warning" value={false}>
          <LockOpen />
          <Typography>{props.strings["open"]}</Typography>
          <Typography className="CheckSettingsRestriction-description" variant="subtitle2">
            {props.strings["openDescription"]}
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
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
      <Collapse in={restricted}>
        <Divider />
        {renderAddUserButtons.length > 0 && (
          <div className="CheckSettingsAddUser-root">
            <ToggleButtonGroup
              className="CheckSettingsAddUser-type"
              exclusive
              onChange={handleNewUserTypeChange}
              size="small"
              value={newUserType}
            >
              {renderAddUserButtons}
            </ToggleButtonGroup>
            <ValidateTextField
              className="CheckSettingsAddUser-input"
              label={props.strings["email"]}
              onBlur={handleAddUserBlur}
              onChange={handleAddUserChange}
              type="email"
              value={addUserValue}
            />
          </div>
        )}
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
      </Collapse>
    </Dialog>
  );
})`
  ${({ theme }) => `
    &.CheckSettings-root {
      & .CheckSettingsAddUser-root {
        display: flex;
        flex-direction: column;
        margin-top: ${theme.spacing(2)};

        & .CheckSettingsAddUser-type {
          align-self: flex-end;

          & .MuiToggleButton-root {
            margin-bottom: -1px;
            padding-left: ${theme.spacing(3)};
            padding-right: ${theme.spacing(3)};

            &:first-of-type {
              border-bottom-left-radius: 0;
            }

            &:last-of-type {
              border-bottom-right-radius: 0;
            }
          }
        }

        & .CheckSettingsAddUser-input {
          flex: 1;

          & .MuiOutlinedInput-notchedOutline {
            border-top-right-radius: 0;
          }
        }
      }

      & .CheckSettingsDelete-root {
        display: flex;
        margin-right: auto;
        white-space: nowrap;

        & .CheckSettingsDelete-confirm {
          align-items: center;
          display: flex;

          & .MuiIconButton-root {
            margin-left: ${theme.spacing(1)};
          }
        }
      }

      & .CheckSettingsLink-root {
        display: flex;
        margin: ${theme.spacing(2, 0)};

        & .CheckSettingsLink-copy {
          margin-left: auto;
        }

        & .CheckSettingsLink-url {
          margin-right: ${theme.spacing(1)};

          & .MuiInputBase-input {
            text-overflow: ellipsis;
          }
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
            color: ${theme.palette.text.disabled};
            text-align: left;
          }
        }
      }

      & .CheckSettingsSave-root {
        margin-left: ${theme.spacing(2)};
      }

      & .MuiDivider-root {
        margin: ${theme.spacing(2, 0, 4, 0)};
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
