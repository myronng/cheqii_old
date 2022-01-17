import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { AddCheck } from "components/home/AddCheck";
import { CheckPreview } from "components/home/CheckPreview";
import { BaseProps, UserAdmin } from "declarations";
import localeSubset from "locales/index.json";
import { InferGetServerSidePropsType } from "next";
import { getAuthUser } from "services/authenticator";
import { dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

const Page = styled(
  (
    props: InferGetServerSidePropsType<typeof getServerSideProps> &
      Pick<BaseProps, "className" | "strings">
  ) => (
    <main className={props.className}>
      <header className="Header-root">
        <AddCheck strings={props.strings} />
        <Account strings={props.strings} />
      </header>
      <div className="Body-root">
        <CheckPreview checks={props.checks} strings={props.strings} />
      </div>
    </main>
  )
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
    const decodedToken = await getAuthUser(context);
    if (decodedToken !== null) {
      const userData: UserAdmin | undefined = (
        await dbAdmin.collection("users").doc(decodedToken.uid).get()
      ).data();
      if (typeof userData !== "undefined") {
        if (userData.checks?.length) {
          const userChecks = userData.checks.slice(0, 12);
          if (userChecks.length > 0) {
            const checkDocs = await dbAdmin.getAll(...userChecks);
            const checks = checkDocs.map((check) => {
              const checkData = check.data()!;
              return {
                editor: checkData.editor ?? {},
                id: check.id,
                modifiedAt: check.updateTime?.toMillis(),
                owner: checkData.owner,
                title: checkData.title,
                viewer: checkData.viewer ?? {},
              };
            });
            return {
              props: {
                auth: decodedToken,
                checks,
                strings,
              },
            };
          }
        }
        return {
          props: {
            auth: decodedToken,
            checks: [],
            strings,
          },
        };
      }
    }
  }
  return { props: { strings } };
});

export default Page;
