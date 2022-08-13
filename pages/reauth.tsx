import { ReauthPage } from "components/reauth";
import localeSubset from "locales/reauth.json";
import { InferGetServerSidePropsType } from "next";
import { getAuthUser } from "services/authenticator";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

export type ReauthPageProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const Page = (props: ReauthPageProps) => <ReauthPage {...props} />;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  if (context.req.cookies.authToken) {
    const decodedToken = await getAuthUser(context);
    if (decodedToken !== null && decodedToken.email) {
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
          auth: decodedToken,
          strings,
        },
      };
    }
  }

  return {
    notFound: true,
  };
});

export default Page;
