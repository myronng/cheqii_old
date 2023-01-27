import { ReauthPage } from "components/reauth";
import localeSubset from "locales/reauth.json";
import { InferGetServerSidePropsType } from "next";
import { getAuthUser } from "services/authenticator";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

export type ReauthPageProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const Page = (props: ReauthPageProps) => <ReauthPage {...props} />;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const authUser = await getAuthUser(context);
  if (authUser && !authUser.isAnonymous) {
    const strings = getLocaleStrings(localeSubset, context.locale);
    if (!context.query.method) {
      return {
        redirect: {
          destination: "/settings",
          permanent: false,
        },
      };
    }
    return {
      props: {
        ...context.query,
        auth: authUser,
        strings,
      },
    };
  }

  return {
    notFound: true,
  };
});

export default Page;
