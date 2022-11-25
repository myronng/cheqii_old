// import { handleDuplicateCredentials } from "components/auth/AuthProviders";
import { useSnackbar } from "components/SnackbarContextProvider";
import { AuthUser } from "declarations";
import { onIdTokenChanged } from "firebase/auth";
import { useRouter } from "next/router";
import { destroyCookie, setCookie } from "nookies";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { auth } from "services/firebase";

// type FetchSite = "cross-site" | "same-origin" | "same-site" | "none";

export type AuthType = Partial<NonNullable<AuthUser>>;

type AuthReducerAction =
  | (AuthType & {
      token: string;
    })
  | null;

type AuthReducer = (state: AuthType, action: AuthReducerAction) => AuthType;

const AuthContext = createContext<{
  userInfo: AuthType;
  setUserInfo: Dispatch<AuthReducerAction>;
}>({ userInfo: {}, setUserInfo: (_state: AuthReducerAction) => {} });

const authReducer: AuthReducer = (_state, action) => {
  if (action === null) {
    destroyCookie(undefined, "authToken", {
      path: "/",
    });
    return {};
  } else {
    const { token, ...userInfo } = action;
    setCookie(undefined, "authToken", token, {
      maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
      path: "/",
      sameSite: "strict",
      secure: true,
    });
    return userInfo;
  }
};

export const AuthContextProvider = (
  props: PropsWithChildren<{ auth: AuthType; reauth?: boolean }>
) => {
  const [userInfo, setUserInfo] = useReducer(authReducer, props.auth);
  const { setSnackbar } = useSnackbar();
  const router = useRouter();

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
          if (props.reauth) {
            setCookie(undefined, "authToken", tokenResult.token, {
              maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
              path: "/",
              sameSite: "strict",
              secure: true,
            });
            router.reload();
          } else {
            setUserInfo({
              displayName: tokenResult.claims.name ? String(tokenResult.claims.name) : undefined,
              email: tokenResult.claims.email ? String(tokenResult.claims.email) : undefined,
              isAnonymous: nextUser.isAnonymous,
              photoURL: tokenResult.claims.picture ? String(tokenResult.claims.picture) : undefined,
              token: tokenResult.token,
              uid: tokenResult.claims.user_id ? String(tokenResult.claims.user_id) : undefined,
            });
          }
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
          setUserInfo({
            displayName: tokenResult.claims.name ? String(tokenResult.claims.name) : undefined,
            email: tokenResult.claims.email ? String(tokenResult.claims.email) : undefined,
            isAnonymous: user.isAnonymous,
            photoURL: tokenResult.claims.picture ? String(tokenResult.claims.picture) : undefined,
            token: tokenResult.token,
            uid: tokenResult.claims.user_id ? String(tokenResult.claims.user_id) : undefined,
          });
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
  }, [props.reauth, router, setSnackbar]);

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        setUserInfo,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

AuthContextProvider.displayName = "AuthContextProvider";
