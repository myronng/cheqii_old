import { getAuth, IdTokenResult, onIdTokenChanged, User } from "firebase/auth";
import { destroyCookie, setCookie } from "nookies";
import { createContext, PropsWithChildren, useContext, useEffect, useReducer } from "react";
import { useSnackbar } from "./SnackbarContextProvider";

export type AuthType = Partial<Pick<User, "email" | "uid">>;

export interface ServerAuthProps {
  auth: AuthType;
}

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
  const [userInfo, setUserInfo] = useReducer(authReducer, { ...props.auth });
  const { setSnackbar } = useSnackbar();

  useEffect(() => {
    const auth = getAuth();

    onIdTokenChanged(auth, async (nextUser) => {
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
