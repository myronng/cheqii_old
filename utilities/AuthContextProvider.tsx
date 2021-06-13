import { getAuth, onIdTokenChanged, User } from "@firebase/auth";
import nookies from "nookies";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

export type AuthType = Partial<Pick<User, "email" | "uid">>;

export interface ServerAuthProps {
  auth: AuthType;
}

const AuthContext = createContext<AuthType>({});

export const AuthContextProvider = (props: PropsWithChildren<ServerAuthProps>) => {
  const [userInfo, setUserInfo] = useState<AuthType>({ ...props.auth });

  useEffect(() => {
    const auth = getAuth();
    onIdTokenChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUserInfo({});
        nookies.set({}, "authToken", "", {
          path: "/",
          sameSite: "strict",
          secure: window.location.protocol === "https:",
        });
      } else {
        setUserInfo({ email: nextUser.email, uid: nextUser.uid });
        const token = await nextUser.getIdToken();
        nookies.set({}, "authToken", token, {
          path: "/",
          sameSite: "strict",
          secure: window.location.protocol === "https:",
        });
      }
    });
  }, []);

  useEffect(() => {
    const refreshToken = setInterval(async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        await user.getIdToken(true);
      }
    }, 600000);

    return () => clearInterval(refreshToken);
  }, []);

  return <AuthContext.Provider value={userInfo}>{props.children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
