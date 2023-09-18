import { AuthLayout } from "components/auth/Layout";
import { LinkRow } from "components/auth/LinkRow";
import { LinkButton } from "components/Link";
import Head from "next/head";
import { RegisterPageProps } from "pages/register";

export const RegisterPage = (props: RegisterPageProps) => (
  <AuthLayout mode="register" strings={props.strings} title={props.strings["register"]}>
    <Head>
      <title>{props.strings["register"]}</title>
    </Head>
    <LinkRow>
      <LinkButton className="Auth-back" NextLinkProps={{ href: "/" }} variant="text">
        {props.strings["goBack"]}
      </LinkButton>
      <LinkButton className="Auth-signIn" NextLinkProps={{ href: "/auth" }} variant="text">
        {props.strings["signIn"]}
      </LinkButton>
    </LinkRow>
  </AuthLayout>
);
