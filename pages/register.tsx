import { AuthLayout } from "components/auth/Layout";
import { LinkRow } from "components/auth/LinkRow";
import { LinkButton } from "components/Link";
import { GetServerSideProps } from "next";
import { verifyAuthToken } from "services/firebaseAdmin";

const Page = () => (
  <AuthLayout mode="register" title="Register">
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
        className="Auth-signIn"
        loadingId="Auth-signIn"
        NextLinkProps={{ href: "/auth" }}
        variant="text"
      >
        Sign in
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
