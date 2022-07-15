import { AuthLayout } from "components/auth/Layout";
import { LinkRow } from "components/auth/LinkRow";
import { LinkButton } from "components/Link";
import Head from "next/head";
import { AuthPageProps } from "pages/auth";

export const AuthPage = (props: AuthPageProps) => (
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
