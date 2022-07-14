import { AccountCircle, Email, Person } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { useLoading } from "components/LoadingContextProvider";
import { PreferencesHeader } from "components/preferences/PreferencesHeader";
import { useSnackbar } from "components/SnackbarContextProvider";
import { ValidateForm, ValidateSubmitButton, ValidateTextField } from "components/ValidateForm";
import { getAuth, updateEmail, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { PreferencesPageProps } from "pages/preferences";
import { ChangeEventHandler, useRef, useState } from "react";
import { db } from "services/firebase";

export const PreferencesPage = styled((props: PreferencesPageProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const userInfo = useAuth();
  const [values, setValues] = useState(props.userData);
  const untouchedValues = useRef({
    email: props.userData.email,
    displayName: props.userData.displayName,
    photoURL: props.userData.photoURL,
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
        if (untouchedValues.current.email !== values.email) {
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
