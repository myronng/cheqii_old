import { AuthUser } from "declarations";
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { destroyCookie } from "nookies";
import { authAdmin } from "services/firebaseAdmin";

export const getAuthUser: (
  context: GetServerSidePropsContext | { req: NextApiRequest; res: NextApiResponse }
) => Promise<AuthUser> = async (context) => {
  try {
    const decodedToken = await authAdmin.verifyIdToken(String(context.req.cookies.authToken));
    return {
      displayName: decodedToken.name || null,
      email: decodedToken.email || null,
      isAnonymous: decodedToken.firebase.sign_in_provider === "anonymous",
      photoURL: decodedToken.picture || null,
      uid: decodedToken.uid,
    };
  } catch (err) {
    destroyCookie(context, "authToken", {
      path: "/",
    });
    return null;
  }
};
