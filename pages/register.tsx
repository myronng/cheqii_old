import { AuthLayout } from "components/auth/Layout";
import { LinkRow } from "components/auth/LinkRow";
import { LinkButton } from "components/Link";
import { verifyAuthToken } from "services/firebaseAdmin";
import { withContextErrorHandler } from "services/middleware";

const Page = () => (
  <AuthLayout mode="register" title="Register">
    <LinkRow>
      <LinkButton className="Auth-back" NextLinkProps={{ href: "/" }} variant="text">
        Go back
      </LinkButton>
      <LinkButton className="Auth-signIn" NextLinkProps={{ href: "/auth" }} variant="text">
        Sign in
      </LinkButton>
    </LinkRow>
  </AuthLayout>
);

export const getServerSideProps = withContextErrorHandler(async (context) => {
  if (context.req.cookies.authToken) {
    const decodedToken = await verifyAuthToken(context);
    if (decodedToken !== null && decodedToken.email) {
      return {
        redirect: {
          permanent: false,
          destination: "/",
        },
      };
    }
  }
  return {
    props: {
      // fetchSite: context.req.headers["sec-fetch-site"],
    },
  };
});

export default Page;
