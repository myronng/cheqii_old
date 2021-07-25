import { GetServerSidePropsContext } from "next";
import { destroyCookie } from "nookies";
import { authAdmin } from "services/firebaseAdmin";

export const verifyAuthToken = async (context: GetServerSidePropsContext) => {
  try {
    return await authAdmin.verifyIdToken(context.req.cookies.authToken);
  } catch (err) {
    destroyCookie(context, "authToken", {
      path: "/",
    });
    return null;
  }
};
