import { styled } from "@material-ui/core/styles";
import { Account } from "components/Account";
import { AddCheck } from "components/home/AddCheck";
import { CheckPreview } from "components/home/CheckPreview";
import { Check, StyledProps } from "declarations";
import { InferGetServerSidePropsType } from "next";
import { verifyAuthToken } from "services/authenticator";
import { dbAdmin } from "services/firebaseAdmin";
import { withContextErrorHandler } from "services/middleware";

const Page = styled(
  (props: InferGetServerSidePropsType<typeof getServerSideProps> & StyledProps) => {
    return (
      <main className={props.className}>
        <header className="Header-root">
          <AddCheck />
          <Account />
        </header>
        <div className="Body-root">
          <CheckPreview checks={props.checks} />
        </div>
      </main>
    );
  }
)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;

    & .Body-root {
      align-items: center;
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: center;
    }

    & .Header-root {
      display: flex;
      margin: ${theme.spacing(2)};
    }
  `}
`;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  if (context.req.cookies.authToken) {
    const decodedToken = await verifyAuthToken(context);
    if (decodedToken !== null) {
      const userData = (await dbAdmin.collection("users").doc(decodedToken.uid).get()).data();
      if (userData) {
        let checks = [] as Check[];
        const userChecks = userData.checks.slice(0, 12);
        if (userChecks.length > 0) {
          const checkDocs = await dbAdmin.getAll(...userChecks);
          checks = checkDocs.map((check) => ({
            ...(check.data() as Check),
            id: check.id,
            modifiedAt: check.updateTime?.toMillis(),
          }));
        }
        return {
          props: {
            auth: {
              email: typeof decodedToken.email === "string" ? decodedToken.email : null,
              uid: decodedToken.uid,
            },
            checks,
          },
        };
      }
    }
  }
  return { props: {} };
});

export default Page;
