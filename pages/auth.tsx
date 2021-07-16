import { AuthLayout } from "components/auth/Layout";
import { LinkRow } from "components/auth/LinkRow";
import { Link } from "components/Link";
import { GetServerSideProps } from "next";
import { verifyAuthToken } from "services/firebaseAdmin";

const Page = () => (
  <AuthLayout mode="auth" title="Sign In">
    <LinkRow>
      <Link className="Auth-back" NextLinkProps={{ href: "/" }}>
        Go back
      </Link>
      <Link className="Auth-register" NextLinkProps={{ href: "/register" }}>
        Register
      </Link>
    </LinkRow>
    <LinkRow>
      <Link className="Auth-reset" NextLinkProps={{ href: "/resetPassword" }}>
        Forgot your password?
      </Link>
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
