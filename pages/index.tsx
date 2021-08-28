import { styled } from "@material-ui/core/styles";
import { Account } from "components/Account";
import { AddCheck } from "components/home/AddCheck";
import { CheckPreview } from "components/home/CheckPreview";
import { Check, BaseProps, UserAdmin } from "declarations";
import localeSubset from "locales/index.json";
import { InferGetServerSidePropsType } from "next";
import { verifyAuthToken } from "services/authenticator";
import { dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

const Page = styled(
  (
    props: InferGetServerSidePropsType<typeof getServerSideProps> &
      Pick<BaseProps, "className" | "strings">
  ) => {
    return (
      <main className={props.className}>
        <header className="Header-root">
          <AddCheck strings={props.strings} />
          <Account strings={props.strings} />
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

    & .Account-root {
      margin-left: auto;
    }

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
  const strings = getLocaleStrings(context.locale!, localeSubset);
  if (context.req.cookies.authToken) {
    const decodedToken = await verifyAuthToken(context);
    if (decodedToken !== null) {
      const userData: UserAdmin = (
        await dbAdmin.collection("users").doc(decodedToken.uid).get()
      ).data()!;
      if (userData) {
        let checks: Check[] = [];
        if (userData.checks?.length) {
          const userChecks = userData.checks!.slice(0, 12);
          if (userChecks.length > 0) {
            const checkDocs = await dbAdmin.getAll(...userChecks);
            checks = checkDocs.map((check) => {
              const checkData = check.data()!;
              return {
                name: checkData.name,
                id: check.id,
                modifiedAt: check.updateTime?.toMillis(),
              };
            });
          }
        }
        return {
          props: {
            auth: decodedToken,
            checks,
            strings,
          },
        };
      }
    }
  }
  return { props: { strings } };
});

export default Page;
