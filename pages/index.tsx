import { styled } from "@material-ui/core/styles";
import { Account } from "components/Account";
import { AddCheck } from "components/home/AddCheck";
import { StyledProps, User } from "declarations";
import { InferGetServerSidePropsType } from "next";
import { firebaseAdmin, verifyAuthToken } from "services/firebaseAdmin";
import { withContextErrorHandler } from "services/middleware";

const Page = styled(
  (props: InferGetServerSidePropsType<typeof getServerSideProps> & StyledProps) => {
    console.log(props.checks);
    return (
      <main className={props.className}>
        <header className="Header-root">
          <Account />
        </header>
        <div className="Body-root">
          <AddCheck />
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
      justify-content: center;
    }

    & .Header-root {
      display: flex;
      justify-content: flex-end;
      margin: ${theme.spacing(2)};

      & .MuiLoadingButton-root {
        margin-left: ${theme.spacing(2)};
      }
    }
  `}
`;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  if (context.req.cookies.authToken) {
    const decodedToken = await verifyAuthToken(context);
    if (decodedToken !== null) {
      const { db } = firebaseAdmin;
      const usersRef = await db.collection("users").doc(decodedToken.uid).get();
      const userData = (await usersRef.data()) as User;
      if (userData) {
        const checkData = await db.getAll(...userData.checks);
        const checks = checkData.map((check) => check.data());
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
