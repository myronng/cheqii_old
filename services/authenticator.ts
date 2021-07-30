import { GetServerSidePropsContext } from "next";
import { destroyCookie } from "nookies";
import { authAdmin } from "services/firebaseAdmin";

export const verifyAuthToken = async (context: GetServerSidePropsContext) => {
  try {
    const decodedToken = await authAdmin.verifyIdToken(context.req.cookies.authToken);
    return {
      displayName: decodedToken.name || null,
      email: decodedToken.email || null,
      profilePhoto: decodedToken.picture || null,
      uid: decodedToken.uid,
    };
  } catch (err) {
    destroyCookie(context, "authToken", {
      path: "/",
    });
    return null;
  }
};
