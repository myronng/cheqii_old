// import { handleDuplicateCredentials } from "components/auth/AuthProviders";
import { AuthUser } from "declarations";
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

// type FetchSite = "cross-site" | "same-origin" | "same-site" | "none";

export type AuthType = Partial<NonNullable<AuthUser>>;

type AuthReducer = (
  state: AuthType,
  action: {
    isAnonymous: boolean;
    tokenResult: IdTokenResult;
  } | null
) => AuthType;

const AuthContext = createContext<AuthType>({});

const authReducer: AuthReducer = (_state, action) => {
  if (action === null) {
    destroyCookie(undefined, "authToken", {
      path: "/",
    });
    return {};
  } else {
    setCookie(undefined, "authToken", action.tokenResult.token, {
      path: "/",
      sameSite: "strict",
      secure: true,
    });
    return {
      displayName: action.tokenResult.claims.name as User["displayName"],
      email: action.tokenResult.claims.email as User["email"],
      isAnonymous: action.isAnonymous,
      photoURL: action.tokenResult.claims.picture as User["photoURL"],
      uid: action.tokenResult.claims.user_id as User["uid"],
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
          setUserInfo({ isAnonymous: nextUser.isAnonymous, tokenResult });
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
          setUserInfo({ isAnonymous: user.isAnonymous, tokenResult });
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
