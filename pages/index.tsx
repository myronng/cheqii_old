import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { AddCheck } from "components/home/AddCheck";
import { CheckPreview } from "components/home/CheckPreview";
import { Logo } from "components/Logo";
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
    <div className={props.className}>
      <Head>
        <title>{props.strings["applicationTitle"]}</title>
      </Head>
      <header className="Header-root">
        <Logo />
        <Typography className="Header-title" component="h1" variant="h2">
          {props.strings["applicationTitle"]}
        </Typography>
        <Account className="Header-account" strings={props.strings} />
      </header>
      <main className="Body-root">
        <div>Placeholder</div>
        <CheckPreview
          checks={props.checks}
          strings={props.strings}
          totalCheckCount={props.totalCheckCount}
        />
      </main>
      <AddCheck strings={props.strings} />
    </div>
  )
)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;

    & .Body-root {
      display: grid;
      flex: 1;
      grid-template-rows: 1fr auto;
      overflow: auto;
    }

    & .Header-account {
      margin-left: auto;
    }

    & .Header-title {
      align-self: center;
      margin-bottom: 0;
      margin-left: ${theme.spacing(2)};
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
          let totalCheckCount = 0;
          if (typeof userData.checks?.length !== "undefined" && userData.checks.length > 0) {
            totalCheckCount = userData.checks.length;
            const userChecks = userData.checks.slice(0, 6);
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
            totalCheckCount,
          };
        }
      });
    }
  }
  return { props: { checks: [], totalCheckCount: 0, strings, ...authProps } };
});

export default Page;
