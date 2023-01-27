import { AuthPage } from "components/auth";
import localeSubset from "locales/auth.json";
import { InferGetServerSidePropsType } from "next";
import { getAuthUser } from "services/authenticator";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

export type AuthPageProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const Page = (props: AuthPageProps) => <AuthPage {...props} />;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const authUser = await getAuthUser(context);
  if (authUser && !authUser.isAnonymous) {
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
    };
  }
  const strings = getLocaleStrings(localeSubset, context.locale);
  return {
    props: {
      strings,
      // fetchSite: context.req.headers["sec-fetch-site"],
    },
  };
});

export default Page;
