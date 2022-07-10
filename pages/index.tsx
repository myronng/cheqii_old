import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { CheckPreview, CheckPreviewType } from "components/home/CheckPreview";
import { Logo } from "components/Logo";
import { BaseProps, UserAdmin } from "declarations";
import { FieldValue } from "firebase-admin/firestore";
import localeSubset from "locales/index.json";
import { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { getAuthUser } from "services/authenticator";
import { dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

const SLOTS_PER_PAGE = 6;
const CHECKS_PER_PAGE = SLOTS_PER_PAGE - 1;

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
        <CheckPreview
          allCheckIds={props.allCheckIds}
          checks={props.checks}
          checksPerPage={CHECKS_PER_PAGE}
          slotsPerPage={SLOTS_PER_PAGE}
          strings={props.strings}
        />
      </main>
    </div>
  )
)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    font-family: "Fira Code";
    height: 100vh;
    width: 100%;

    & .Body-root {
      display: flex;
      flex: 1;
      flex-direction: column;
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
        const userData = (await transaction.get(userDoc)).data() as UserAdmin | undefined;
        if (typeof userData !== "undefined") {
          const checks: CheckPreviewType[] = [];
          const allCheckIds = userData.checks?.map((check) => check.id);
          if (userData.checks?.length) {
            // Leave one spot to create a new check
            const userChecks = userData.checks.slice(0, CHECKS_PER_PAGE);
            const checkDocs = await transaction.getAll(...userChecks);
            userChecks.filter((item) => item);
            const prunedChecks: UserAdmin["checks"] = [];
            checkDocs.forEach((check) => {
              const checkData = check.data();
              if (typeof checkData !== "undefined") {
                checks.push({
                  data: {
                    contributors: checkData.contributors,
                    editor: checkData.editor ?? {},
                    items: checkData.items,
                    owner: checkData.owner,
                    title: checkData.title,
                    updatedAt: checkData.updatedAt,
                    viewer: checkData.viewer ?? {},
                  },
                  id: check.id,
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
            allCheckIds,
            auth: decodedToken,
            checks,
          };
        }
      });
    }
  }
  return { props: { allCheckIds: [], checks: [], strings, ...authProps } };
});

export default Page;
