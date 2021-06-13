import { IconButton, useMediaQuery } from "@material-ui/core";
import { styled, useTheme } from "@material-ui/core/styles";
import { Facebook, Google } from "@material-ui/icons";
import {
  getAuth,
  GoogleAuthProvider,
  linkWithPopup,
  OAuthCredential,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { useRouter } from "next/router";
import { useSnackbar } from "utilities/SnackbarContextProvider";

interface AuthLayoutProps {
  className?: string;
  setLoading: (state: boolean) => void;
}

export const AuthProviders = styled((props: AuthLayoutProps) => {
  const router = useRouter();
  const { setSnackbar } = useSnackbar();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down("md"));

  const handleGoogleAuthClick = async () => {
    try {
      props.setLoading(true);
      const provider = new GoogleAuthProvider();
      const auth = getAuth();
      if (mobileLayout) {
        await signInWithRedirect(auth, provider);
      } else {
        if (auth.currentUser) {
          await linkWithPopup(auth.currentUser, provider);
        } else {
          await signInWithPopup(auth, provider);
        }
        router.push("/");
      }
    } catch (err) {
      if (err.code === "auth/credential-already-in-use") {
        const credential = GoogleAuthProvider.credentialFromError(err) as OAuthCredential;
        const auth = getAuth();
        // TODO: Migrate anonUser's data to linked credential
        auth.currentUser?.delete();
        await signInWithCredential(auth, credential);
        router.push("/");
      } else {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
      props.setLoading(false);
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
