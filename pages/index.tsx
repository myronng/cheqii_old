import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { AddCheck } from "components/home/AddCheck";
import { CheckPreview } from "components/home/CheckPreview";
import { BaseProps, Check, Metadata, UserAdmin } from "declarations";
import { FieldValue } from "firebase-admin/firestore";
import localeSubset from "locales/index.json";
import { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { getAuthUser } from "services/authenticator";
import { dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

type CheckPreviewType = {
  check: Pick<Check, "editor" | "owner" | "title" | "viewer">;
  metadata: Metadata;
};

const Page = styled(
  (
    props: InferGetServerSidePropsType<typeof getServerSideProps> &
      Pick<BaseProps, "className" | "strings">
  ) => (
    <main className={props.className}>
      <Head>
        <title>{props.strings["applicationTitle"]}</title>
      </Head>
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
  const strings = getLocaleStrings(localeSubset, context.locale);
  let authProps;
  if (context.req.cookies.authToken) {
    const decodedToken = await getAuthUser(context);
    if (decodedToken !== null) {
      authProps = await dbAdmin.runTransaction(async (transaction) => {
        const userDoc = dbAdmin.collection("users").doc(decodedToken.uid);
        const userData = (await transaction.get(userDoc)).data() as UserAdmin;
        if (typeof userData !== "undefined") {
          const checks: CheckPreviewType[] = [];
          if (typeof userData.checks?.length !== "undefined" && userData.checks.length > 0) {
            const userChecks = userData.checks.slice(0, 12);
            const checkDocs = await transaction.getAll(...userChecks);
            userChecks.filter((item) => item);
            const prunedChecks: UserAdmin["checks"] = [];
            checkDocs.forEach((check) => {
              const checkData = check.data();
              if (typeof checkData !== "undefined") {
                checks.push({
                  check: {
                    editor: checkData.editor ?? {},
                    owner: checkData.owner,
                    title: checkData.title,
                    viewer: checkData.viewer ?? {},
                  },
                  metadata: {
                    id: check.id,
                    modifiedAt: check.updateTime?.toMillis(),
                  },
                });
              } else {
                // Cache for pruning in a single transaction
                prunedChecks.push(check.ref);
              }
            });
            if (prunedChecks.length > 0) {
              // Prune stale/unlinked references
              transaction.update(userDoc, {
                checks: FieldValue.arrayRemove(...prunedChecks),
              });
            }
          }
          return {
            auth: decodedToken,
            checks,
          };
        }
      });
    }
  }
  return { props: { strings, ...authProps } };
});

export default Page;
