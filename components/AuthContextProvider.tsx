import { useSnackbar } from "components/SnackbarContextProvider";
import { AuthUser } from "declarations";
import { onIdTokenChanged, signInWithCustomToken } from "firebase/auth";
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

export type AuthType = Partial<NonNullable<AuthUser>>;

type AuthReducerAction =
  | (AuthType & {
      idToken: string;
      refreshToken: string;
    })
  | null;

type AuthReducer = (state: AuthType, action: AuthReducerAction) => AuthType;

const AuthContext = createContext<{
  userInfo: AuthType;
  setUserInfo: Dispatch<AuthReducerAction>;
}>({ userInfo: {}, setUserInfo: () => {} });

const authReducer: AuthReducer = (_state, action) => {
  if (action === null) {
    destroyCookie(undefined, "authToken", {
      path: "/",
    });
    destroyCookie(undefined, "refreshToken", {
      path: "/",
    });
    return {};
  } else {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 10);
    const { idToken, refreshToken, ...userInfo } = action;
    setCookie(undefined, "authToken", idToken, {
      maxAge: expiryDate.toUTCString(),
      path: "/",
      sameSite: "strict",
      secure: true,
    });
    setCookie(undefined, "refreshToken", refreshToken, {
      maxAge: expiryDate.toUTCString(),
      path: "/",
      sameSite: "strict",
      secure: true,
    });
    return userInfo;
  }
};

export const AuthContextProvider = (
  props: PropsWithChildren<{ auth: AuthType; customToken?: string }>
) => {
  const [userInfo, setUserInfo] = useReducer(authReducer, props.auth);
  const { setSnackbar } = useSnackbar();
  const router = useRouter();

  useEffect(() => {
    if (props.customToken) {
      signInWithCustomToken(auth, props.customToken);
    }
    // If both the authToken and the refreshToken cookies are undefined,
    // props.auth will be null but the indexed DB might still contain a
    // refresh token. Delete the DB *BEFORE* ID token is checked to
    // prevent desynced auth states.
    if (props.auth === null) {
      indexedDB.deleteDatabase("firebaseLocalStorageDb");
    }

    const unsubscribeIdTokenChanged = onIdTokenChanged(auth, async (nextUser) => {
      try {
        if (!nextUser) {
          destroyCookie(undefined, "authToken", {
            path: "/",
          });
          destroyCookie(undefined, "refreshToken", {
            path: "/",
          });
          setUserInfo(null);
        } else {
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 10);
          const tokenResult = await nextUser.getIdTokenResult();
          setCookie(undefined, "authToken", tokenResult.token, {
            maxAge: expiryDate.toUTCString(),
            path: "/",
            sameSite: "strict",
            secure: true,
          });
          setCookie(undefined, "refreshToken", nextUser.refreshToken, {
            maxAge: expiryDate.toUTCString(),
            path: "/",
            sameSite: "strict",
            secure: true,
          });
          setUserInfo({
            displayName: tokenResult.claims.name ? String(tokenResult.claims.name) : undefined,
            email: tokenResult.claims.email ? String(tokenResult.claims.email) : undefined,
            idToken: tokenResult.token,
            isAnonymous: nextUser.isAnonymous,
            photoURL: tokenResult.claims.picture ? String(tokenResult.claims.picture) : undefined,
            refreshToken: nextUser.refreshToken,
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
    });

    const refreshToken = setInterval(async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const tokenResult = await user.getIdTokenResult(true);
          setUserInfo({
            displayName: tokenResult.claims.name ? String(tokenResult.claims.name) : undefined,
            email: tokenResult.claims.email ? String(tokenResult.claims.email) : undefined,
            idToken: tokenResult.token,
            isAnonymous: user.isAnonymous,
            photoURL: tokenResult.claims.picture ? String(tokenResult.claims.picture) : undefined,
            refreshToken: user.refreshToken,
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
      unsubscribeIdTokenChanged();
    };
  }, [props.auth, props.customToken, router, setSnackbar]);

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
