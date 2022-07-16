import { AccountCircle, CameraAlt, Email, Person } from "@mui/icons-material";
import { IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { useLoading } from "components/LoadingContextProvider";
import { PreferencesHeader } from "components/preferences/PreferencesHeader";
import { useSnackbar } from "components/SnackbarContextProvider";
import { UserAvatar } from "components/UserAvatar";
import { ValidateForm, ValidateSubmitButton, ValidateTextField } from "components/ValidateForm";
import { getAuth, updateEmail, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { PreferencesPageProps } from "pages/preferences";
import { ChangeEventHandler, useRef, useState } from "react";
import { db } from "services/firebase";

export const PreferencesPage = styled((props: PreferencesPageProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const { userInfo, setUserInfo } = useAuth();
  const [values, setValues] = useState({
    displayName: userInfo.displayName,
    email: userInfo.email,
    photoURL: userInfo.photoURL,
  });
  const untouchedValues = useRef({
    displayName: userInfo.displayName,
    email: userInfo.email,
    photoURL: userInfo.photoURL,
  });

  const handleEmailChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setValues({ ...values, email: e.target.value });
  };

  const handleDisplayNameChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setValues({ ...values, displayName: e.target.value });
  };

  const handleFormSubmit = async () => {
    try {
      setLoading({
        active: true,
        id: "preferencesSubmit",
      });
      const auth = getAuth();
      if (auth.currentUser !== null) {
        if (values.email && untouchedValues.current.email !== values.email) {
          await updateEmail(auth.currentUser, values.email);
        }
        if (
          untouchedValues.current.displayName !== values.displayName ||
          untouchedValues.current.photoURL !== values.photoURL
        ) {
          await updateProfile(auth.currentUser, {
            displayName: values.displayName,
            photoURL: values.photoURL,
          });
        }
        await updateDoc(doc(db, "users", String(userInfo.uid)), {
          email: values.email,
          displayName: values.displayName,
        });
        setUserInfo({
          ...userInfo,
          displayName: values.displayName,
          email: values.email,
          photoURL: values.photoURL,
          token: await auth.currentUser.getIdToken(),
        });
        untouchedValues.current = { ...values };
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

  return (
    <div className={props.className}>
      <PreferencesHeader strings={props.strings} />
      <main className="Body-root">
        <ValidateForm className="Body-container" onSubmit={handleFormSubmit}>
          <Typography className="Body-heading" component="h2" variant="h2">
            <AccountCircle fontSize="inherit" />
            <span>{props.strings["profile"]}</span>
          </Typography>
          <IconButton
            className={`AvatarUploader-root ${loading.active ? "disabled" : ""}`}
            component="label"
            htmlFor="avatarUploader"
          >
            <UserAvatar
              className="AvatarUploader-avatar"
              displayName={userInfo.displayName}
              email={userInfo.email}
              photoURL={userInfo.photoURL}
              size={96}
            />
            <CameraAlt className="AvatarUploader-icon" />
            <input
              className="AvatarUploader-input"
              disabled={loading.active}
              hidden
              id="avatarUploader"
              type="file"
            />
          </IconButton>
          <ValidateTextField
            autoComplete="email"
            InputProps={{
              startAdornment: <Email />,
            }}
            label={props.strings["email"]}
            onChange={handleEmailChange}
            type="email"
            value={values.email}
          />
          <ValidateTextField
            autoComplete="name"
            InputProps={{
              startAdornment: <Person />,
            }}
            label={props.strings["name"]}
            onChange={handleDisplayNameChange}
            value={values.displayName}
          />
          <ValidateSubmitButton
            loading={loading.queue.includes("preferencesSubmit")}
            variant="outlined"
          >
            {props.strings["save"]}
          </ValidateSubmitButton>
        </ValidateForm>
      </main>
    </div>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;

    & .AvatarUploader-root {
      margin: 0 auto;
      position: relative;

      &:not(.disabled) {
        cursor: pointer;

        & .AvatarUploader-avatar {
          border-color: ${theme.palette.primary.main};
        }
      }

      & .AvatarUploader-avatar {
        border: 2px solid ${theme.palette.action.disabled};
      }

      & .AvatarUploader-icon {
        background: ${theme.palette.background.paper};
        border: 2px solid ${theme.palette.divider};
        border-radius: 50%;
        bottom: 4px;
        height: 32px;
        padding: ${theme.spacing(0.5)};
        position: absolute;
        right: 4px;
        width: 32px;
      }

      & .AvatarUploader-input {
        // display: none;
      }
    }

    & .Body-container {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(4)};
      padding: ${theme.spacing(2)};

      ${theme.breakpoints.down("sm")} {
        width: 100%;
      }

      ${theme.breakpoints.up("sm")} {
        min-width: 600px;
      }

      & .Body-heading {
        align-items: center;
        display: flex;
        padding: ${theme.spacing(0, 2.25)};

        & .MuiSvgIcon-root {
          margin-right: ${theme.spacing(2)};
        }
      }
    }

    & .Body-root {
      align-items: center;
      background: ${theme.palette.background.secondary};
      border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};
      display: flex;
      flex: 1;
      justify-content: center;
      overflow: auto;
    }

    & .Header-title {
      align-self: center;
      margin-bottom: 0;
      margin-left: ${theme.spacing(2)};
    }

    & .Header-root {
      display: flex;
      margin: ${theme.spacing(2)};
    }
  `}
`;
