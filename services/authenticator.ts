import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { destroyCookie } from "nookies";
import { authAdmin } from "services/firebaseAdmin";

type AuthUser = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
} | null;

export const getAuthUser: (
  context: GetServerSidePropsContext | { req: NextApiRequest; res: NextApiResponse }
) => Promise<AuthUser> = async (context) => {
  try {
    const decodedToken = await authAdmin.verifyIdToken(context.req.cookies.authToken);
    return {
      displayName: decodedToken.name || null,
      email: decodedToken.email || null,
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
