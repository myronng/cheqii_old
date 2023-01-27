import { AuthUser } from "declarations";
import { FirebaseError } from "firebase-admin";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { destroyCookie } from "nookies";
import { FIREBASE_TOKEN_ENDPOINT } from "services/constants";
import { authAdmin } from "services/firebaseAdmin";

type Context = GetServerSidePropsContext | { req: NextApiRequest; res: NextApiResponse };

export const getAuthUser: (context: Context) => Promise<AuthUser | false> = async (context) => {
  try {
    if (context.req.cookies.authToken) {
      const decodedToken = await authAdmin.verifyIdToken(context.req.cookies.authToken);
      return {
        displayName: decodedToken.name || null,
        email: decodedToken.email || null,
        isAnonymous: decodedToken.firebase.sign_in_provider === "anonymous",
        photoURL: decodedToken.picture || null,
        uid: decodedToken.uid,
      };
    } else if (context.req.cookies.refreshToken) {
      const refreshTokenResponse = await fetch(
        `${FIREBASE_TOKEN_ENDPOINT}?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `grant_type=refresh_token&refresh_token=${context.req.cookies.refreshToken}`,
        }
      );
      const newAuthToken = await refreshTokenResponse.json();
      const decodedToken = await authAdmin.verifyIdToken(newAuthToken.id_token);
      return {
        displayName: decodedToken.name || null,
        email: decodedToken.email || null,
        isAnonymous: decodedToken.firebase.sign_in_provider === "anonymous",
        photoURL: decodedToken.picture || null,
        uid: decodedToken.uid,
      };
    } else {
      return null;
    }
  } catch (err) {
    const typedError = err as FirebaseError;
    if (typedError.code === "auth/id-token-expired") {
      return false;
    }
    destroyCookie(context, "authToken", {
      path: "/",
    });
    return null;
  }
};

export const getAuthUserSafe = async (context: Context) => {
  const registeredAuthUser = await getAuthUser(context);
  let authUser: AuthUser;
  let customToken: string | null;
  if (registeredAuthUser) {
    authUser = registeredAuthUser;
    customToken = null;
  } else {
    const newUser = await authAdmin.createUser({
      disabled: false,
    });
    authUser = {
      displayName: null,
      email: null,
      isAnonymous: true,
      photoURL: null,
      uid: newUser.uid,
    };
    customToken = await authAdmin.createCustomToken(authUser.uid);
  }
  return { authUser, customToken };
};
