import {
  IconButton,
  Typography,
  // useMediaQuery
} from "@material-ui/core";
import {
  styled,
  // useTheme
} from "@material-ui/core/styles";
import { Facebook, Google } from "@material-ui/icons";
import { LoadingButton } from "@material-ui/lab";
import { LayoutViewOptions } from "components/auth/Layout";
import { StyledProps } from "declarations";
import {
  AuthErrorCodes,
  FacebookAuthProvider,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  // linkWithRedirect,
  signInWithCredential,
  signInWithPopup,
  // signInWithRedirect,
} from "firebase/auth";
import { useRouter } from "next/router";
import { auth } from "services/firebase";
import { useSnackbar } from "utilities/SnackbarContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { migrateMissingUserData, migrateUserData } from "services/migrator";

type AuthProviders = FacebookAuthProvider | GoogleAuthProvider;
type AuthProvidersProps = StyledProps & {
  setLoading: (state: boolean) => void;
  setView: (state: LayoutViewOptions) => void;
};
type LinkedAuthProvidersProps = AuthProvidersProps & {
  view: LayoutViewOptions;
};

export const PROVIDERS = {
  [FacebookAuthProvider.PROVIDER_ID]: "Facebook",
  [GoogleAuthProvider.PROVIDER_ID]: "Google",
};

// (err: any) --> (err: FirebaseError) depends on https://github.com/firebase/firebase-admin-node/issues/403
// export const handleDuplicateCredentials = async (
//   err: any,
//   auth: Auth,
//   router: NextRouter,
//   provider: AuthProviders
// ) => {
//   let oAuthCredential = null as OAuthCredential | null;
//   if (provider instanceof GoogleAuthProvider) {
//     oAuthCredential = GoogleAuthProvider.credentialFromError(err);
//   } else if (provider instanceof FacebookAuthProvider) {
//     oAuthCredential = FacebookAuthProvider.credentialFromError(err);
//   }
//   if (oAuthCredential !== null) {
//     // TODO: Migrate anonUser's data to linked credential
//     auth.currentUser?.delete();
//     await signInWithCredential(auth, oAuthCredential);
//     router.push("/");
//   }
// };

export const AuthProviders = styled((props: AuthProvidersProps) => {
  const { loading } = useLoading();
  const router = useRouter();
  const { setSnackbar } = useSnackbar();
  // const theme = useTheme();
  // const mobileLayout = useMediaQuery(theme.breakpoints.down("md"));

  const handleAuth = async (provider: AuthProviders) => {
    try {
      props.setLoading(true);
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
      await migrateMissingUserData(credential.user);
      router.push("/");
      // }
    } catch (err) {
      try {
        if (err.code === AuthErrorCodes.CREDENTIAL_ALREADY_IN_USE) {
          // Handle upgrading anonymous account
          const oAuthCredential = getCredentialsFromError(err, provider);
          if (oAuthCredential !== null) {
            if (auth.currentUser) {
              const anonymousUserId = auth.currentUser.uid;
              auth.currentUser.delete();
              const existingCredential = await signInWithCredential(auth, oAuthCredential);
              await migrateUserData(anonymousUserId, existingCredential.user);
              router.push("/");
            } else {
              handleError(err);
            }
          }
          // await handleDuplicateCredentials(err, auth!, router, provider);
        } else if (err.code === AuthErrorCodes.NEED_CONFIRMATION) {
          // Handle linking accounts from multiple providers
          const oAuthCredential = getCredentialsFromError(err, provider);
          if (oAuthCredential !== null) {
            const signInMethods = await fetchSignInMethodsForEmail(auth, err.customData.email);
            if (signInMethods[0] === "password") {
              props.setView({
                data: {
                  credential: oAuthCredential,
                  email: err.customData.email,
                  newProvider: provider.providerId as keyof typeof PROVIDERS,
                },
                type: "password",
              });
            } else {
              props.setView({
                data: {
                  credential: oAuthCredential,
                  email: err.customData.email,
                  existingProvider: signInMethods[0] as keyof typeof PROVIDERS,
                  newProvider: provider.providerId as keyof typeof PROVIDERS,
                },
                type: "provider",
              });
            }
            props.setLoading(false);
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

  const handleError = (err: any) => {
    setSnackbar({
      active: true,
      message: err,
      type: "error",
    });
    props.setLoading(false);
  };

  const handleFacebookAuthClick = async () => {
    const provider = new FacebookAuthProvider();
    handleAuth(provider);
  };

  const handleGoogleAuthClick = async () => {
    const provider = new GoogleAuthProvider();
    handleAuth(provider);
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
          fill: ${theme.palette.action.disabled};
        }
      }

      & .MuiSvgIcon-root {
        fill: ${theme.palette.text.primary};
      }
    }
  `}
`;

const getCredentialsFromError = (err: any, provider: AuthProviders) => {
  if (provider instanceof GoogleAuthProvider) {
    return GoogleAuthProvider.credentialFromError(err);
  } else if (provider instanceof FacebookAuthProvider) {
    return FacebookAuthProvider.credentialFromError(err);
  } else {
    return null;
  }
};

export const LinkedAuthProvider = styled((props: LinkedAuthProvidersProps) => {
  const router = useRouter();
  const { setSnackbar } = useSnackbar();
  const viewData = props.view.data!;

  const handleAuthClick = async () => {
    try {
      props.setLoading(true);
      const provider =
        viewData.existingProvider === FacebookAuthProvider.PROVIDER_ID
          ? new FacebookAuthProvider()
          : new GoogleAuthProvider();
      const existingCredential = await signInWithPopup(auth, provider);
      await linkWithCredential(existingCredential.user, viewData.credential);
      router.push("/");
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      props.setLoading(false);
    }
  };

  const handleBack = () => {
    props.setView({ type: "default" });
  };

  return (
    <div className={`LinkedAuthProviders-root ${props.className}`}>
      <Typography className="LinkedAuthProviders-text" component="p" variant="h6">
        {viewData.email} already uses {PROVIDERS[viewData.existingProvider!]} as an authentication
        provider. Sign in to add {PROVIDERS[viewData.newProvider!]} as an authentication provider
        for your account.
      </Typography>
      <div className="LinkedAuthProviders-nav">
        <LoadingButton className="LinkedAuthProviders-back" onClick={handleBack} variant="outlined">
          Go back
        </LoadingButton>
        <LoadingButton
          className="LinkedAuthProviders-submit"
          loading={false}
          onClick={handleAuthClick}
          variant="contained"
        >
          Continue
        </LoadingButton>
      </div>
    </div>
  );
})`
  ${({ theme }) => `
    background: ${theme.palette.background[theme.palette.mode]};
    border-radius: ${theme.shape.borderRadius}px;
    padding: ${theme.spacing(4)};

    & .LinkedAuthProviders-nav {
      display: flex;
      justify-content: space-between;
      margin-top: ${theme.spacing(2)};
    }
  `}
`;
