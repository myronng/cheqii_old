// import { handleDuplicateCredentials } from "components/auth/AuthProviders";
import {
  // getRedirectResult,
  IdTokenResult,
  onIdTokenChanged,
  User,
} from "firebase/auth";
// import { useRouter } from "next/router";
import { destroyCookie, setCookie } from "nookies";
import { createContext, PropsWithChildren, useContext, useEffect, useReducer } from "react";
import { firebase } from "services/firebase";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type AuthType = Partial<Pick<User, "email" | "uid">>;

interface ServerAuthProps {
  auth: AuthType;
  // fetchSite?: FetchSite;
}
// type FetchSite = "cross-site" | "same-origin" | "same-site" | "none";
type NullableIdTokenResult = IdTokenResult | null;

const AuthContext = createContext<AuthType>({});

const authReducer = (_state: AuthType, action: NullableIdTokenResult): AuthType => {
  if (!action) {
    destroyCookie({}, "authToken", {
      path: "/",
    });
    return {};
  } else {
    setCookie({}, "authToken", action.token, {
      path: "/",
      sameSite: "strict",
      secure: window.location.protocol === "https:",
    });
    return { email: action.claims.email as User["email"], uid: action.claims.sub };
  }
};

export const AuthContextProvider = (props: PropsWithChildren<ServerAuthProps>) => {
  const [userInfo, setUserInfo] = useReducer(authReducer, props.auth);
  const { setSnackbar } = useSnackbar();
  // const router = useRouter();

  useEffect(() => {
    // const checkRedirect = async () => {
    //   try {
    //     const credentials = await getRedirectResult(props.firebaseAuth);
    //     if (credentials === null) {
    //       // setLoading(false);
    //     } else {
    //       router.push("/");
    //     }
    //   } catch (err) {
    //     if (err.code === "auth/credential-already-in-use") {
    //       try {
    //         await handleDuplicateCredentials(err, props.firebaseAuth, router);
    //       } catch (err) {
    //         setSnackbar({
    //           active: true,
    //           message: err,
    //           type: "error",
    //         });
    //         // setLoading(false);
    //       }
    //     } else {
    //       setSnackbar({
    //         active: true,
    //         message: err,
    //         type: "error",
    //       });
    //       // setLoading(false);
    //     }
    //   }
    // };

    // if (props.fetchSite === "cross-site") {
    //   checkRedirect();
    // }

    onIdTokenChanged(firebase.auth, async (nextUser) => {
      try {
        if (!nextUser) {
          setUserInfo(null);
        } else {
          setUserInfo(await nextUser.getIdTokenResult());
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    });

    const refreshToken = setInterval(async () => {
      try {
        const user = firebase.auth.currentUser;
        if (user) {
          const tokenResult = await user.getIdTokenResult(true);
          setUserInfo(tokenResult);
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    }, 600000);

    return () => {
      clearInterval(refreshToken);
    };
  }, []);

  return <AuthContext.Provider value={userInfo}>{props.children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
