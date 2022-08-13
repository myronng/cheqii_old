import { Email, VpnKey } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { EXTERNAL_AUTH_PROVIDERS } from "components/auth/AuthProviders";
import { LayoutViewOptions } from "components/auth/Layout";
import { redirect } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { ValidateForm, ValidateSubmitButton, ValidateTextField } from "components/ValidateForm";
import { BaseProps } from "declarations";
import { FirebaseError } from "firebase/app";
import {
  AuthErrorCodes,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { FormEventHandler } from "react";
import { auth } from "services/firebase";
import { interpolateString } from "services/formatter";
import { migrateMissingUserData } from "services/migrator";

export type EmailFormProps = Omit<EmailProviderProps, "title"> &
  Pick<BaseProps, "children"> & {
    email?: string | null;
    onSubmit: FormEventHandler<HTMLFormElement>;
  };

export type EmailProviderProps = Pick<BaseProps, "className" | "strings"> & {
  mode: "auth" | "register";
  title: string;
};

type LinkedEmailProviderProps = Pick<BaseProps, "className" | "strings"> & {
  setView: (state: LayoutViewOptions) => void;
  view: Required<LayoutViewOptions>;
};

export const EmailForm = styled((props: EmailFormProps) => (
  <ValidateForm className={props.className} onSubmit={props.onSubmit}>
    <ValidateTextField
      autoComplete="email"
      className="EmailProvider-email"
      defaultValue={props.email}
      disabled={Boolean(props.email)}
      InputProps={{
        startAdornment: <Email />,
      }}
      label={props.strings["email"]}
      name="email"
      type="email"
    />
    <ValidateTextField
      autoComplete={props.mode === "register" ? "new-password" : "current-password"}
      className="EmailProvider-password"
      InputProps={{
        startAdornment: <VpnKey />,
      }}
      inputProps={{
        minLength: 8,
      }}
      label={props.strings["password"]}
      name="password"
      type="password"
    />
    {props.children}
  </ValidateForm>
))`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(4)};
  `}
`;

export const EmailProvider = (props: EmailProviderProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();

  const handleError = (err: any) => {
    setSnackbar({
      active: true,
      message: err,
      type: "error",
    });
    setLoading({ active: false, id: "authSubmit" });
  };

  const handleFormSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
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
        if (
          err instanceof FirebaseError &&
          err.code === AuthErrorCodes.EMAIL_EXISTS &&
          auth.currentUser !== null
        ) {
          const anonymousToken = await auth.currentUser.getIdToken();
          await signInWithEmailAndPassword(auth, email, password);
          await fetch(`/api/user/migrate/${anonymousToken}/`, {
            method: "POST",
          });
          redirect(setLoading, "/");
        } else {
          handleError(err);
        }
      } catch (err) {
        handleError(err);
      }
    }
  };

  return (
    <EmailForm mode={props.mode} onSubmit={handleFormSubmit} strings={props.strings}>
      <ValidateSubmitButton
        className="EmailProvider-submit"
        loading={loading.queue.includes("authSubmit")}
        variant="outlined"
      >
        {props.title}
      </ValidateSubmitButton>
    </EmailForm>
  );
};

export const LinkedEmailProvider = styled((props: LinkedEmailProviderProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const viewData = props.view.data;

  const handleBack = () => {
    props.setView({ type: "default" });
  };
  const handleFormSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    try {
      setLoading({
        active: true,
        id: "linkedAuthSubmit",
      });
      const form = e.target as HTMLFormElement;
      const password = (form.elements.namedItem("password") as HTMLInputElement).value;
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

  return (
    <div className={`LinkedEmailProvider-root ${props.className}`}>
      <Typography className="LinkedAuthProviders-text" component="p" variant="h3">
        {interpolateString(props.strings["emailAddProvider"], {
          provider: props.strings[EXTERNAL_AUTH_PROVIDERS[viewData.newProvider].label],
        })}
      </Typography>
      <EmailForm
        email={viewData.email}
        mode="auth"
        onSubmit={handleFormSubmit}
        strings={props.strings}
      >
        <nav className="LinkedEmailProvider-nav">
          <LoadingButton
            className="LinkedAuthProviders-back"
            onClick={handleBack}
            variant="outlined"
          >
            {props.strings["goBack"]}
          </LoadingButton>
          <ValidateSubmitButton
            className="LinkedAuthProviders-submit"
            loading={loading.queue.includes("linkedAuthSubmit")}
            variant="contained"
          >
            {props.strings["continue"]}
          </ValidateSubmitButton>
        </nav>
      </EmailForm>
    </div>
  );
})`
  ${({ theme }) => `
    background: ${theme.palette.background.secondary};
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(4)};
    padding: ${theme.spacing(4)};

    ${theme.breakpoints.up("sm")} {
      border-radius: ${theme.shape.borderRadius}px;
    }

    & .LinkedEmailProvider-nav {
      display: flex;
      justify-content: space-between;
    }
  `}
`;

EmailProvider.displayName = "EmailProvider";
LinkedEmailProvider.displayName = "LinkedEmailProvider";
