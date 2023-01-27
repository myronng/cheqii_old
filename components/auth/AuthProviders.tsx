import { Facebook, Google } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { IconButton, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { LayoutViewOptions } from "components/auth/Layout";
import { redirect } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { SetSplashState } from "components/SplashContextProvider";
import { BaseProps } from "declarations";
import { FirebaseError } from "@firebase/util";
import {
  AuthErrorCodes,
  AuthProvider,
  FacebookAuthProvider,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  // linkWithRedirect,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { MouseEventHandler } from "react";
import { auth } from "services/firebase";
import { interpolateString } from "services/formatter";

export type AuthFormProps = Pick<BaseProps, "children" | "className"> & {
  hint: string;
};

type AuthProvidersProps = Pick<BaseProps, "className"> & {
  setLoading: SetSplashState;
  setView: (state: LayoutViewOptions) => void;
};
type LinkedAuthProvidersProps = AuthProvidersProps &
  Pick<BaseProps, "strings"> & {
    view: Required<LayoutViewOptions>;
  };

export const EXTERNAL_AUTH_PROVIDERS: Record<
  string,
  {
    provider: AuthProvider;
    label: string;
  }
> = {
  [FacebookAuthProvider.PROVIDER_ID]: {
    label: "facebook",
    provider: new FacebookAuthProvider(),
  },
  [GoogleAuthProvider.PROVIDER_ID]: {
    label: "google",
    provider: new GoogleAuthProvider(),
  },
};

export const AuthForm = styled((props: AuthFormProps) => (
  <div className={props.className}>
    <Typography component="p" variant="h3">
      {props.hint}
    </Typography>
    {props.children}
  </div>
))`
  ${({ theme }) => `
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(4)};
`}
`;

export const AuthProviders = styled((props: AuthProvidersProps) => {
  const { loading } = useLoading();
  const { setSnackbar } = useSnackbar();
  // const theme = useTheme();
  // const mobileLayout = useMediaQuery(theme.breakpoints.down("md"));

  const handleAuth = async (provider: AuthProvider) => {
    try {
      props.setLoading({ active: true });
      // if (mobileLayout) {
      //   if (auth.currentUser) {
      //     await linkWithRedirect(auth.currentUser, provider);
      //   } else {
      //     await signInWithRedirect(auth, provider);
      //   }
      // } else {
      // Verified logins will always replace unverified logins without linking and without throwing an error: https://github.com/firebase/firebase-ios-sdk/issues/5344
      // E.g. Signing in with an unlinked Google account for a gmail address will overwrite an unverified Facebook login
      let credential;
      if (auth.currentUser?.isAnonymous) {
        credential = await linkWithPopup(auth.currentUser, provider);
      } else {
        credential = await signInWithPopup(auth, provider);
      }
      // Create or update (merge) account
      await fetch("/api/user", {
        body: JSON.stringify(credential.user),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });
      redirect(props.setLoading, "/");
      // }
    } catch (err) {
      try {
        if (err instanceof Error && err.name === "FirebaseError") {
          const typedError = err as FirebaseError;
          if (typedError.code === AuthErrorCodes.CREDENTIAL_ALREADY_IN_USE) {
            // Handle upgrading anonymous account
            const oAuthCredential = getCredentialsFromError(typedError, provider);
            if (oAuthCredential !== null) {
              if (auth.currentUser) {
                const anonymousToken = await auth.currentUser.getIdToken();
                await signInWithCredential(auth, oAuthCredential);
                await fetch(`/api/user/migrate/${anonymousToken}/`, {
                  method: "POST",
                });
                redirect(props.setLoading, "/");
              } else {
                handleError(typedError);
              }
            }
          } else if (typedError.code === AuthErrorCodes.NEED_CONFIRMATION) {
            // Handle linking accounts from multiple providers
            const oAuthCredential = getCredentialsFromError(typedError, provider);
            if (
              oAuthCredential !== null &&
              typeof typedError.customData !== "undefined" &&
              typeof typedError.customData.email === "string"
            ) {
              const signInMethods = await fetchSignInMethodsForEmail(
                auth,
                typedError.customData.email
              );
              if (signInMethods[0] === "password") {
                props.setView({
                  data: {
                    credential: oAuthCredential,
                    email: typedError.customData.email,
                    newProvider: provider.providerId,
                  },
                  type: "password",
                });
              } else {
                props.setView({
                  data: {
                    credential: oAuthCredential,
                    email: typedError.customData.email,
                    existingProvider: signInMethods[0],
                    newProvider: provider.providerId,
                  },
                  type: "provider",
                });
              }
              props.setLoading({ active: false });
            } else {
              handleError(typedError);
            }
          } else {
            handleError(err);
          }
        } else {
          handleError(err);
        }
      } catch (err) {
        handleError(err);
      }
    }
  };

  const handleError = (err: unknown) => {
    setSnackbar({
      active: true,
      message: err,
      type: "error",
    });
    props.setLoading({ active: false });
  };

  const handleFacebookAuthClick = async () => {
    handleAuth(EXTERNAL_AUTH_PROVIDERS[FacebookAuthProvider.PROVIDER_ID].provider);
  };

  const handleGoogleAuthClick = async () => {
    handleAuth(EXTERNAL_AUTH_PROVIDERS[GoogleAuthProvider.PROVIDER_ID].provider);
  };

  return (
    <div className={`${props.className} AuthProviders-root`}>
      <IconButton
        className="AuthProviders-google"
        color="primary"
        disabled={loading.active}
        onClick={handleGoogleAuthClick}
      >
        <Google />
      </IconButton>
      <IconButton
        className="AuthProviders-facebook"
        color="primary"
        disabled={loading.active}
        onClick={handleFacebookAuthClick}
      >
        <Facebook />
      </IconButton>
    </div>
  );
})`
  ${({ theme }) => `
    display: flex;
    justify-content: center;

    & .MuiIconButton-root {
      margin: 0 ${theme.spacing(1)};
      border: 2px solid ${theme.palette.primary.main};
      border-radius: 50%;

      &.Mui-disabled {
        border-color: ${theme.palette.action.disabled};

        & .MuiSvgIcon-root {
          fill: ${theme.palette.text.disabled};
        }
      }

      & .MuiSvgIcon-root {
        fill: ${theme.palette.text.primary};
      }
    }
  `}
`;

const getCredentialsFromError = (err: FirebaseError, provider: AuthProvider) => {
  if (provider instanceof GoogleAuthProvider) {
    return GoogleAuthProvider.credentialFromError(err);
  } else if (provider instanceof FacebookAuthProvider) {
    return FacebookAuthProvider.credentialFromError(err);
  } else {
    return null;
  }
};

export const LinkedAuthProvider = styled((props: LinkedAuthProvidersProps) => {
  const { setSnackbar } = useSnackbar();
  const viewData = props.view.data;

  const handleAuthClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
    try {
      if (typeof viewData.existingProvider !== "undefined") {
        props.setLoading({ active: true });
        const provider = EXTERNAL_AUTH_PROVIDERS[viewData.existingProvider].provider;
        // viewData.existingProvider === FacebookAuthProvider.PROVIDER_ID
        //   ? new FacebookAuthProvider()
        //   : new GoogleAuthProvider();
        const existingCredential = await signInWithPopup(auth, provider);
        await linkWithCredential(existingCredential.user, viewData.credential);
        redirect(props.setLoading, "/");
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      props.setLoading({ active: false });
    }
  };

  const handleBack: MouseEventHandler<HTMLButtonElement> = (_e) => {
    props.setView({ type: "default" });
  };

  return (
    <AuthForm
      className={props.className}
      hint={interpolateString(props.strings["providerAddProvider"], {
        email: viewData.email,
        existingProvider:
          props.strings[EXTERNAL_AUTH_PROVIDERS[String(viewData.existingProvider)].label],
        newProvider: props.strings[EXTERNAL_AUTH_PROVIDERS[viewData.newProvider].label],
      })}
    >
      <div className="LinkedAuthProviders-nav">
        <LoadingButton className="LinkedAuthProviders-back" onClick={handleBack} variant="outlined">
          {props.strings["goBack"]}
        </LoadingButton>
        <LoadingButton
          className="LinkedAuthProviders-submit"
          onClick={handleAuthClick}
          variant="contained"
        >
          {props.strings["continue"]}
        </LoadingButton>
      </div>
    </AuthForm>
  );
})`
  ${({ theme }) => `
    background: ${theme.palette.background.secondary};
    padding: ${theme.spacing(4)};

    ${theme.breakpoints.up("sm")} {
      border-radius: ${theme.shape.borderRadius}px;
    }

    & .LinkedAuthProviders-nav {
      display: flex;
      justify-content: space-between;
    }
  `}
`;

AuthProviders.displayName = "AuthProviders";
LinkedAuthProvider.displayName = "LinkedAuthProvider";
