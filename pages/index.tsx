import { styled } from "@material-ui/core/styles";
import { Account } from "components/Account";
import { AddCheck } from "components/home/AddCheck";
import { CheckPreview } from "components/home/CheckPreview";
import { StyledProps, User } from "declarations";
import { InferGetServerSidePropsType } from "next";
import { dbAdmin, verifyAuthToken } from "services/firebaseAdmin";
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

      & .CheckPreview-root {
        & .MuiCardHeader-subheader {
          align-items: center;
          color: ${theme.palette.action.disabled};
          display: flex;

          & .MuiSvgIcon-root {
            margin-right: ${theme.spacing(0.5)};
          }

          & .MuiTypography-root {
            letter-spacing: 1px;
          }
        }
      }
    }

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
      const usersRef = await dbAdmin.collection("users").doc(decodedToken.uid).get();
      const userData = (await usersRef.data()) as User;
      if (userData) {
        const userChecks = userData.checks.slice(0, 12);
        const checkData = await dbAdmin.getAll(...userChecks);
        const checks = checkData.map((check) => ({
          ...check.data(),
          id: check.id,
          modifiedAt: check.updateTime?.toMillis(),
        }));
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
