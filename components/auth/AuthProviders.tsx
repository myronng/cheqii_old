import {
  IconButton,
  // useMediaQuery
} from "@material-ui/core";
import {
  styled,
  // useTheme
} from "@material-ui/core/styles";
import { Facebook, Google } from "@material-ui/icons";
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  linkWithPopup,
  // linkWithRedirect,
  OAuthCredential,
  signInWithCredential,
  signInWithPopup,
  // signInWithRedirect,
} from "firebase/auth";
import { NextRouter, useRouter } from "next/router";
import { useSnackbar } from "utilities/SnackbarContextProvider";

interface AuthLayoutProps {
  className?: string;
  setLoading: (state: boolean) => void;
}

// (err: any) --> (err: FirebaseError) depends on https://github.com/firebase/firebase-admin-node/issues/403
export const handleDuplicateCredentials = async (err: any, auth: Auth, router: NextRouter) => {
  const oAuthCredential = GoogleAuthProvider.credentialFromError(err) as OAuthCredential;
  // TODO: Migrate anonUser's data to linked credential
  auth.currentUser?.delete();
  await signInWithCredential(auth, oAuthCredential);
  router.push("/");
};

export const AuthProviders = styled((props: AuthLayoutProps) => {
  const router = useRouter();
  const { setSnackbar } = useSnackbar();
  // const theme = useTheme();
  // const mobileLayout = useMediaQuery(theme.breakpoints.down("md"));

  const handleError = (err: any) => {
    setSnackbar({
      active: true,
      message: err,
      type: "error",
    });
    props.setLoading(false);
  };

  const handleGoogleAuthClick = async () => {
    let auth: Auth;
    try {
      props.setLoading(true);
      const provider = new GoogleAuthProvider();
      auth = getAuth();
      // if (mobileLayout) {
      //   if (auth.currentUser) {
      //     await linkWithRedirect(auth.currentUser, provider);
      //   } else {
      //     await signInWithRedirect(auth, provider);
      //   }
      // } else {
      auth.currentUser
        ? await linkWithPopup(auth.currentUser, provider)
        : await signInWithPopup(auth, provider);
      router.push("/");
      // }
    } catch (err) {
      if (err.code === "auth/credential-already-in-use") {
        try {
          await handleDuplicateCredentials(err, auth!, router);
        } catch (err) {
          handleError(err);
        }
      } else {
        handleError(err);
      }
    }
  };

  return (
    <div className={`${props.className} AuthProviders-root`}>
      <IconButton className="AuthProviders-google" color="primary" onClick={handleGoogleAuthClick}>
        <Google />
      </IconButton>
      <IconButton className="AuthProviders-facebook" color="primary">
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

      &:before {
        border: 1px solid ${theme.palette.primary.main};
        border-radius: 50%;
        content: " ";
        height: 100%;
        position: absolute;
        width: 100%;
      }

      & .MuiSvgIcon-root {
        fill: ${theme.palette.text.primary};
      }
    }
  `}
`;
