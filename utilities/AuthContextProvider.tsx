import { getAuth, onIdTokenChanged, User } from "@firebase/auth";
import nookies from "nookies";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

type AuthType = User | null;

const AuthContext = createContext<AuthType>(null);

export const AuthContextProvider = (props: PropsWithChildren<{}>) => {
  const [user, setUser] = useState<AuthType>(null);

  useEffect(() => {
    const auth = getAuth();
    onIdTokenChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        nookies.set({}, "authToken", "", {
          path: "/",
          sameSite: "strict",
          secure: window.location.protocol === "https:",
        });
      } else {
        setUser(nextUser);
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

  return <AuthContext.Provider value={user}>{props.children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
