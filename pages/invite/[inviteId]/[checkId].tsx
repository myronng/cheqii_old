import { redirect } from "components/Link";
import { useSplash } from "components/SplashContextProvider";
import localeSubset from "locales/invite.json";
import { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { UnauthorizedError } from "services/error";
import { dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { setSplash } = useSplash();

  useEffect(() => {
    redirect(
      setSplash,
      `/check/${router.query.checkId}?inviteId=${router.query.inviteId}`,
      `/check/${router.query.checkId}`
    );
  }, [router, setSplash]);
  return (
    <>
      <Head>
        <title>{props.strings["applicationTitle"]}</title>
      </Head>
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
      if (restricted === true) {
        if (context.query.inviteId !== checkData.invite.id) {
          throw new UnauthorizedError();
        }
      }
      return {
        props: {
          reload: true,
          strings,
        },
      };
    }
  }

  throw new UnauthorizedError();
});

export default Page;
