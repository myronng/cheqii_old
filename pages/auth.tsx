import { AuthLayout } from "components/auth/Layout";
import { LinkRow } from "components/auth/LinkRow";
import { LinkButton } from "components/Link";
import { GetServerSideProps } from "next";
import { verifyAuthToken } from "services/firebaseAdmin";

const Page = () => (
  <AuthLayout mode="auth" title="Sign In">
    <LinkRow>
      <LinkButton
        className="Auth-back"
        loadingId="Auth-back"
        NextLinkProps={{ href: "/" }}
        variant="text"
      >
        Go back
      </LinkButton>
      <LinkButton
        className="Auth-register"
        loadingId="Auth-register"
        NextLinkProps={{ href: "/register" }}
        variant="text"
      >
        Register
      </LinkButton>
    </LinkRow>
    <LinkRow>
      <LinkButton
        className="Auth-reset"
        loadingId="Auth-reset"
        NextLinkProps={{ href: "/resetPassword" }}
        variant="text"
      >
        Forgot your password?
      </LinkButton>
    </LinkRow>
  </AuthLayout>
);

export const getServerSideProps: GetServerSideProps = async (context) => {
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
};

export default Page;
