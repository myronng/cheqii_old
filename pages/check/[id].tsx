import {} from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { ArrowBack } from "@material-ui/icons";
import { Account } from "components/Account";
import { LinkIconButton } from "components/Link";
import { CheckUser, StyledProps } from "declarations";
import { InferGetServerSidePropsType } from "next";
import { UnauthorizedError } from "services/error";
import { firebase } from "services/firebase";
import { firebaseAdmin, verifyAuthToken } from "services/firebaseAdmin";
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
      const { db } = firebaseAdmin;
      const checkUsersRef = await db
        .collection("checks")
        .doc(context.query.id as string)
        .get();
      const checkUserData = checkUsersRef.data()?.users as CheckUser;
      if (checkUserData.some((user) => (user.uid = decodedToken.uid))) {
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
