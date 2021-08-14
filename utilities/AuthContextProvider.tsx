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
import { auth } from "services/firebase";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type AuthType = Partial<Pick<User, "displayName" | "email" | "photoURL" | "uid">>;

// type FetchSite = "cross-site" | "same-origin" | "same-site" | "none";

const AuthContext = createContext<AuthType>({});

const authReducer = (_state: AuthType, action: IdTokenResult | null): AuthType => {
  if (!action) {
    destroyCookie(undefined, "authToken", {
      path: "/",
    });
    return {};
  } else {
    setCookie(undefined, "authToken", action.token, {
      path: "/",
      sameSite: "strict",
      secure: window.location.protocol === "https:",
    });
    return {
      displayName: action.claims.name as User["displayName"],
      email: action.claims.email as User["email"],
      photoURL: action.claims.picture as User["photoURL"],
      uid: action.claims.user_id as User["uid"],
    };
  }
};

export const AuthContextProvider = (props: PropsWithChildren<{ auth: AuthType }>) => {
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

    onIdTokenChanged(auth, async (nextUser) => {
      try {
        if (!nextUser) {
          setUserInfo(null);
        } else {
          const tokenResult = await nextUser.getIdTokenResult();
          setUserInfo(tokenResult);
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
        const user = auth.currentUser;
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
