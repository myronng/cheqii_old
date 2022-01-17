import { AuthLayout } from "components/auth/Layout";
import { LinkRow } from "components/auth/LinkRow";
import { LinkButton } from "components/Link";
import localeSubset from "locales/auth.json";
import { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { getAuthUser } from "services/authenticator";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

const Page = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => (
  <AuthLayout mode="auth" strings={props.strings} title={props.strings["signIn"]}>
    <Head>
      <title>{props.strings["signIn"]}</title>
    </Head>
    <LinkRow>
      <LinkButton className="Auth-back" NextLinkProps={{ href: "/" }} variant="text">
        {props.strings["goBack"]}
      </LinkButton>
      <LinkButton className="Auth-register" NextLinkProps={{ href: "/register" }} variant="text">
        {props.strings["register"]}
      </LinkButton>
    </LinkRow>
    <LinkRow>
      <LinkButton className="Auth-reset" NextLinkProps={{ href: "/resetPassword" }} variant="text">
        {props.strings["forgotYourPassword"]}
      </LinkButton>
    </LinkRow>
  </AuthLayout>
);

export const getServerSideProps = withContextErrorHandler(async (context) => {
  if (context.req.cookies.authToken) {
    const decodedToken = await getAuthUser(context);
    if (decodedToken !== null && decodedToken.email) {
      return {
        redirect: {
          permanent: false,
          destination: "/",
        },
      };
    }
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
