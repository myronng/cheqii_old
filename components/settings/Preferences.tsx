import { Tune } from "@mui/icons-material";
import { List, Menu, MenuProps, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { InviteType } from "components/check/Header/Settings";
import { ListItem, ListItemCheckbox, ListItemMenu } from "components/List";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { ValidateForm, ValidateSubmitButton } from "components/ValidateForm";
import { BaseProps, User } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { ChangeEventHandler, FormEventHandler, MouseEventHandler, useState } from "react";
import { db } from "services/firebase";

type PreferencesProps = Pick<BaseProps, "className" | "strings"> & {
  userData: User;
};

const INVITE_TYPE: InviteType[] = [
  {
    id: "editor",
    primary: "inviteAsEditor",
    secondary: "inviteAsEditorSettingsHint",
  },
  {
    id: "viewer",
    primary: "inviteAsViewer",
    secondary: "inviteAsViewerSettingsHint",
  },
];

export const Preferences = styled((props: PreferencesProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [inviteRequired, setInviteRequired] = useState(props.userData.invite?.required ?? true);
  const [inviteType, setInviteType] = useState(
    INVITE_TYPE.find((inviteType) => props.userData.invite?.type === inviteType.id) ??
      INVITE_TYPE[0]
  );
  const [inviteTypeMenu, setInviteTypeMenu] = useState<HTMLElement | null>(null);

  const handleFormSubmit: FormEventHandler<HTMLFormElement> = async (_e) => {
    try {
      setLoading({
        active: true,
        id: "preferencesSubmit",
      });
      const newUserData = {
        invite: {
          required: inviteRequired,
          type: inviteType.id,
        },
        updatedAt: Date.now(),
      };
      await updateDoc(doc(db, "users", props.userData.uid), newUserData);
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({
        active: false,
        id: "preferencesSubmit",
      });
    }
  };

  const handleInviteRequiredChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    setInviteRequired(e.target.checked);
  };

  const handleInviteTypeMenuClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setInviteTypeMenu(e.currentTarget);
  };

  const handleInviteTypeMenuClose: MenuProps["onClose"] = () => {
    setInviteTypeMenu(null);
  };

  const renderInviteTypeMenuOptions = INVITE_TYPE.map((invite) => {
    const handleInviteTypeClick: MouseEventHandler<HTMLButtonElement> = async () => {
      try {
        setInviteTypeMenu(null);
        setInviteType(invite);
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
          selected: inviteType.id === invite.id,
        }}
        ListItemTextProps={{
          primary: props.strings[invite.primary],
          secondary: props.strings[invite.secondary],
        }}
      />
    );
  });

  return (
    <ValidateForm className={`Preferences-root ${props.className}`} onSubmit={handleFormSubmit}>
      <Typography className="Preferences-heading" component="h2" id="preferences" variant="h2">
        <Tune fontSize="inherit" />
        <span>{props.strings["preferences"]}</span>
      </Typography>
      <List>
        <ListItemCheckbox
          CheckboxProps={{
            checked: inviteRequired,
            onChange: handleInviteRequiredChange,
            name: "inviteRequired",
          }}
          ListItemTextProps={{
            primary: props.strings["newChecksRequireAnInvite"],
            secondary:
              props.strings[
                inviteRequired
                  ? "newChecksRequireAnInviteHintChecked"
                  : "newChecksRequireAnInviteHintUnchecked"
              ],
          }}
        />
        <ListItemMenu
          ListItemButtonProps={{
            disabled: !inviteRequired,
            onClick: handleInviteTypeMenuClick,
          }}
          ListItemTextProps={{
            primary: props.strings[inviteType.primary],
            secondary: props.strings[inviteType.secondary],
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
      <ValidateSubmitButton
        loading={loading.queue.includes("preferencesSubmit")}
        variant="outlined"
      >
        {props.strings["save"]}
      </ValidateSubmitButton>
    </ValidateForm>
  );
})`
  ${({ theme }) => `
    & .Checkbox-root {
      display: flex;
      flex-direction: column;

      & .Checkbox-hint {
        margin-left: ${theme.spacing(4)};
      }
    }

    & .MuiList-root {
      background: ${theme.palette.action.hover};
      border-radius: ${theme.shape.borderRadius}px;
      overflow: hidden;
      padding: 0;
    }

    & .Preferences-heading {
      align-items: center;
      display: flex;

      & .MuiSvgIcon-root {
        margin-right: ${theme.spacing(2)};
      }
    }
  `}
`;

Preferences.displayName = "Preferences";
