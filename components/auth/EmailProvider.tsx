import { Typography } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { Email, VpnKey } from "@material-ui/icons";
import { LoadingButton } from "@material-ui/lab";
import { PROVIDERS } from "components/auth/AuthProviders";
import { LayoutViewOptions } from "components/auth/Layout";
import { TextField } from "components/auth/TextField";
import { redirect } from "components/Link";
import { ValidateForm, ValidateSubmitButton } from "components/ValidateForm";
import { StyledProps } from "declarations";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { ChangeEventHandler, useState } from "react";
import { migrateMissingUserData, migrateUserData } from "services/migrator";
import { auth } from "services/firebase";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type EmailProviderProps = StyledProps & {
  mode: "auth" | "register";
  title: string;
};

type LinkedEmailProviderProps = StyledProps & {
  setView: (state: LayoutViewOptions) => void;
  view: LayoutViewOptions;
};

export const EmailProvider = styled((props: EmailProviderProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setEmail(e.target.value);
  };
  const handleError = (err: any) => {
    setSnackbar({
      active: true,
      message: err,
      type: "error",
    });
    setLoading({ active: false, id: "authSubmit" });
  };
  const handleFormSubmit = async () => {
    try {
      setLoading({
        active: true,
        id: "authSubmit",
      });
      let credential;
      if (auth.currentUser?.isAnonymous) {
        // Upgrade a registering account from anonymous to permanent
        // Don't allow linking with existing credentials
        credential = await linkWithCredential(
          auth.currentUser,
          EmailAuthProvider.credential(email, password)
        );
      } else {
        if (props.mode === "register") {
          // Create a permanent account
          credential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          // Sign in regularly
          credential = await signInWithEmailAndPassword(auth, email, password);
        }
      }
      await migrateMissingUserData(credential.user);
      redirect(setLoading, "/");
    } catch (err) {
      try {
        if (err.code === "auth/email-already-in-use" && auth.currentUser !== null) {
          const anonymousUserId = auth.currentUser.uid;
          auth.currentUser.delete();
          const existingCredential = await signInWithEmailAndPassword(auth, email, password);
          await migrateUserData(anonymousUserId, existingCredential.user);
          redirect(setLoading, "/");
        } else {
          handleError(err);
        }
      } catch (err) {
        handleError(err);
      }
    }
  };
  const handlePasswordChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPassword(e.target.value);
  };

  return (
    <ValidateForm className={props.className} onSubmit={handleFormSubmit}>
      <TextField
        autoComplete="email"
        className="EmailProvider-email"
        InputProps={{
          startAdornment: <Email />,
        }}
        label="Email"
        onChange={handleEmailChange}
        type="email"
        value={email}
      />
      <TextField
        autoComplete={props.mode === "register" ? "new-password" : "current-password"}
        className="EmailProvider-password"
        InputProps={{
          startAdornment: <VpnKey />,
        }}
        inputProps={{
          minLength: 8,
        }}
        label="Password"
        onChange={handlePasswordChange}
        type="password"
        value={password}
      />
      <ValidateSubmitButton
        className="EmailProvider-submit"
        loading={loading.queue.includes("authSubmit")}
        variant="outlined"
      >
        {props.title}
      </ValidateSubmitButton>
    </ValidateForm>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;

    & .EmailProvider-email {
      margin-top: ${theme.spacing(2)};
    }

    & .EmailProvider-password {
      ${theme.breakpoints.up("xs")} {
        margin-top: ${theme.spacing(2)};
      }
      ${theme.breakpoints.up("md")} {
        margin-top: ${theme.spacing(4)};
      }
    }

    & .EmailProvider-submit {
      ${theme.breakpoints.up("xs")} {
        margin-top: ${theme.spacing(2)};
      }
      ${theme.breakpoints.up("md")} {
        margin-top: ${theme.spacing(4)};
      }
    }
  `}
`;

export const LinkedEmailProvider = styled((props: LinkedEmailProviderProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [password, setPassword] = useState("");
  const viewData = props.view.data!;

  const handleBack = () => {
    props.setView({ type: "default" });
  };
  const handleFormSubmit = async () => {
    try {
      setLoading({
        active: true,
        id: "linkedAuthSubmit",
      });
      const existingCredential = await signInWithEmailAndPassword(auth, viewData.email, password);
      await linkWithCredential(existingCredential.user, viewData.credential);
      redirect(setLoading, "/");
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      setLoading({
        active: false,
        id: "linkedAuthSubmit",
      });
    }
  };
  const handlePasswordChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPassword(e.target.value);
  };

  return (
    <div className={`LinkedEmailProvider-root ${props.className}`}>
      <Typography className="LinkedAuthProviders-text" component="p" variant="h6">
        Sign in to add {PROVIDERS[viewData.newProvider!]} as an authentication provider for your
        account.
      </Typography>
      <ValidateForm className="LinkedEmailProvider-container" onSubmit={handleFormSubmit}>
        <TextField
          autoComplete="email"
          className="LinkedEmailProvider-email"
          disabled
          InputProps={{
            startAdornment: <Email />,
          }}
          label="Email"
          type="email"
          value={viewData.email}
        />
        <TextField
          autoComplete="current-password"
          className="LinkedEmailProvider-password"
          InputProps={{
            startAdornment: <VpnKey />,
          }}
          inputProps={{
            minLength: 8,
          }}
          label="Password"
          onChange={handlePasswordChange}
          type="password"
          value={password}
        />
        <div className="LinkedEmailProvider-nav">
          <LoadingButton
            className="LinkedAuthProviders-back"
            onClick={handleBack}
            variant="outlined"
          >
            Go back
          </LoadingButton>
          <ValidateSubmitButton
            className="LinkedAuthProviders-submit"
            loading={loading.queue.includes("linkedAuthSubmit")}
            variant="contained"
          >
            Continue
          </ValidateSubmitButton>
        </div>
      </ValidateForm>
    </div>
  );
})`
  ${({ theme }) => `
    background: ${theme.palette.background[theme.palette.mode]};
    border-radius: ${theme.shape.borderRadius}px;
    padding: ${theme.spacing(4)};

    & .LinkedEmailProvider-container {
      display: flex;
      flex-direction: column;

      & .LinkedEmailProvider-email {
        margin-top: ${theme.spacing(4)};
      }

      & .LinkedEmailProvider-nav {
        display: flex;
        justify-content: space-between;
        margin-top: ${theme.spacing(4)};
      }

      & .LinkedEmailProvider-password {
        margin-top: ${theme.spacing(4)};
      }

      & .LinkedEmailProvider-submit {
        margin-top: ${theme.spacing(4)};
      }
    }
  `}
`;
