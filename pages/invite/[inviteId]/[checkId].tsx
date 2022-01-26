import { Splash } from "components/Splash";
import { signInAnonymously } from "firebase/auth";
import localeSubset from "locales/invite.json";
import { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getAuthUser } from "services/authenticator";
import { UnauthorizedError } from "services/error";
import { auth } from "services/firebase";
import { dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";
import { useAuth } from "utilities/AuthContextProvider";

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const userInfo = useAuth();
  useEffect(() => {
    const authenticate = async () => {
      if (!userInfo?.uid) {
        await signInAnonymously(auth);
      }
      router.push(
        `/check/${router.query.checkId}?inviteId=${router.query.inviteId}`,
        `/check/${router.query.checkId}`
      );
    };

    authenticate();
  }, []);
  return (
    <>
      <Head>
        <title>{props.strings["applicationTitle"]}</title>
      </Head>
      <Splash open />;
    </>
  );
};

export const getServerSideProps = withContextErrorHandler(async (context) => {
  if (typeof context.query.checkId === "string") {
    const strings = getLocaleStrings(localeSubset, context.locale);
    const check = await dbAdmin.collection("checks").doc(context.query.checkId).get();
    const checkData = check.data();

    if (typeof checkData !== "undefined") {
      const restricted = checkData.invite.required;
      const decodedToken = await getAuthUser(context);
      if (restricted === true) {
        if (context.query.inviteId !== checkData.invite.id) {
          throw new UnauthorizedError();
        }
      }
      return {
        props: {
          auth: decodedToken,
          strings,
        },
      };
    }
  }

  throw new UnauthorizedError();
});

export default Page;
