import { AuthLayout } from "components/auth/Layout";
import { LinkRow } from "components/auth/LinkRow";
import { LinkButton } from "components/Link";
import { verifyAuthToken } from "services/firebaseAdmin";
import { withContextErrorHandler } from "services/middleware";

const Page = () => (
  <AuthLayout mode="auth" title="Sign In">
    <LinkRow>
      <LinkButton className="Auth-back" NextLinkProps={{ href: "/" }} variant="text">
        Go back
      </LinkButton>
      <LinkButton className="Auth-register" NextLinkProps={{ href: "/register" }} variant="text">
        Register
      </LinkButton>
    </LinkRow>
    <LinkRow>
      <LinkButton className="Auth-reset" NextLinkProps={{ href: "/resetPassword" }} variant="text">
        Forgot your password?
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
