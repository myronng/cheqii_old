import { AuthUser } from "declarations";
import { FirebaseError } from "firebase-admin";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { destroyCookie } from "nookies";
import { FIREBASE_TOKEN_ENDPOINT } from "services/constants";
import { authAdmin } from "services/firebaseAdmin";

export const getAuthUser: (
  context: GetServerSidePropsContext | { req: NextApiRequest; res: NextApiResponse }
) => Promise<AuthUser | false> = async (context) => {
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
    const firebaseError = err as FirebaseError;
    if (firebaseError.code === "auth/id-token-expired") {
      return false;
    }
    destroyCookie(context, "authToken", {
      path: "/",
    });
    return null;
  }
};
