import {} from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { ArrowBack } from "@material-ui/icons";
import { Account } from "components/Account";
import { LinkIconButton } from "components/Link";
import { Check, StyledProps } from "declarations";
import { InferGetServerSidePropsType } from "next";
import { verifyAuthToken } from "services/authenticator";
import { UnauthorizedError } from "services/error";
import { db } from "services/firebase";
import { dbAdmin } from "services/firebaseAdmin";
import { withContextErrorHandler } from "services/middleware";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

const Page = styled(
  (props: InferGetServerSidePropsType<typeof getServerSideProps> & StyledProps) => {
    const userInfo = useAuth();
    const { loading, setLoading } = useLoading();
    const { setSnackbar } = useSnackbar();

    return (
      <main className={props.className}>
        <header className="Header-root">
          <LinkIconButton className="Header-back" NextLinkProps={{ href: "/" }}>
            <ArrowBack />
          </LinkIconButton>
          <Account />
        </header>
      </main>
    );
  }
)`
  ${({ theme }) => `
    & .Header-root {
      display: flex;
      justify-content: space-between;
      margin: ${theme.spacing(2)};
    }
  `}
`;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  if (context.req.cookies.authToken) {
    const decodedToken = await verifyAuthToken(context);
    if (decodedToken !== null) {
      const checkUserData = (
        await dbAdmin
          .collection("checks")
          .doc(context.query.id as string)
          .get()
      ).data() as Check;
      if (
        checkUserData &&
        (checkUserData.owner === decodedToken.uid ||
          checkUserData.editors?.some((editor) => editor === decodedToken.uid) ||
          checkUserData.viewers?.some((viewer) => viewer === decodedToken.uid))
      ) {
        return {
          props: {
            auth: {
              email: typeof decodedToken.email === "string" ? decodedToken.email : null,
              uid: decodedToken.uid,
            },
          },
        };
      }
    }
  }
  throw new UnauthorizedError();
});

export default Page;
