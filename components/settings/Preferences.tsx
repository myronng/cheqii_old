import { ExpandMore, Tune } from "@mui/icons-material";
import { List, Menu, MenuProps, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { InviteType } from "components/check/Header/Settings";
import { ListItem, ListItemCheckbox } from "components/List";
import { useLoading } from "components/LoadingContextProvider";
import { usePalette } from "components/PaletteContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { ValidateForm, ValidateFormProps, ValidateSubmitButton } from "components/ValidateForm";
import { BaseProps, User } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { ChangeEventHandler, MouseEventHandler, ReactNode, useState } from "react";
import { db } from "services/firebase";
import { DARK_MODE, LIGHT_MODE, SYSTEM_MODE } from "services/parser";

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

const PALETTE_MODES = [
  {
    id: SYSTEM_MODE,
    primary: "systemDefaultPalette",
  },
  {
    id: LIGHT_MODE,
    primary: "lightPalette",
  },
  {
    id: DARK_MODE,
    primary: "darkPalette",
  },
];

export const Preferences = styled((props: PreferencesProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const { paletteMode, setPaletteMode } = usePalette();
  const { userInfo } = useAuth();
  // TODO: Change preferences to be device specific using IndexedDB
  const [inviteRequired, setInviteRequired] = useState(props.userData.invite?.required ?? true);
  const [inviteType, setInviteType] = useState(
    INVITE_TYPE.find((inviteType) => props.userData.invite?.type === inviteType.id) ??
      INVITE_TYPE[0]
  );
  const selectedPaletteMode =
    PALETTE_MODES.find((currentPaletteMode) => currentPaletteMode.id === paletteMode) ??
    PALETTE_MODES[0];
  const [preferencesMenu, setPreferencesMenu] = useState<HTMLElement | null>(null);
  const [preferencesMenuOptions, setPreferencesMenuOptions] = useState<ReactNode[]>([]);

  const handleFormSubmit: ValidateFormProps["onSubmit"] = async (_e) => {
    try {
      setLoading({
        active: true,
        id: "preferencesSubmit",
      });
      if (userInfo.uid) {
        await updateDoc(doc(db, "users", userInfo.uid), {
          invite: {
            required: inviteRequired,
            type: inviteType.id,
          },
          updatedAt: Date.now(),
        });
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
        id: "preferencesSubmit",
      });
    }
  };

  const handleInviteRequiredChange: ChangeEventHandler<HTMLInputElement> = async (e) => {
    setInviteRequired(e.target.checked);
  };

  const handleInviteTypeMenuClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    const renderInviteTypeMenuOptions = INVITE_TYPE.map((invite) => {
      const handleInviteTypeClick: MouseEventHandler<HTMLButtonElement> = async () => {
        try {
          setPreferencesMenu(null);
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
    setPreferencesMenu(e.currentTarget);
    setPreferencesMenuOptions(renderInviteTypeMenuOptions);
  };

  const handlePreferencesMenuClose: MenuProps["onClose"] = () => {
    setPreferencesMenu(null);
  };

  const handlePaletteModeMenuClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    const renderPaletteModeMenuOptions = PALETTE_MODES.map((currentPaletteMode) => {
      const handlePaletteModeClick: MouseEventHandler<HTMLButtonElement> = async () => {
        try {
          setPreferencesMenu(null);
          setPaletteMode(currentPaletteMode.id);
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
          key={currentPaletteMode.id}
          ListItemButtonProps={{
            onClick: handlePaletteModeClick,
            selected: paletteMode === currentPaletteMode.id,
          }}
          ListItemTextProps={{
            primary: props.strings[currentPaletteMode.primary],
          }}
        />
      );
    });
    setPreferencesMenu(e.currentTarget);
    setPreferencesMenuOptions(renderPaletteModeMenuOptions);
  };

  return (
    <ValidateForm className={`Preferences-root ${props.className}`} onSubmit={handleFormSubmit}>
      <Typography className="Preferences-heading" component="h2" variant="h2">
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
        <ListItem
          Icon={ExpandMore}
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
      <List>
        <ListItem
          Icon={ExpandMore}
          ListItemButtonProps={{
            onClick: handlePaletteModeMenuClick,
          }}
          ListItemTextProps={{
            primary: props.strings[selectedPaletteMode.primary],
            secondary: props.strings["paletteHint"],
          }}
        />
      </List>
      <Menu
        anchorEl={preferencesMenu}
        onClose={handlePreferencesMenuClose}
        open={Boolean(preferencesMenu)}
      >
        {preferencesMenuOptions}
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
