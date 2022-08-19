import { CheckPreviewType, HomePage, HomePageProps } from "components/home";
import { UserAdmin } from "declarations";
import { FieldValue } from "firebase-admin/firestore";
import localeSubset from "locales/index.json";
import { getAuthUser } from "services/authenticator";
import { dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

export const SLOTS_PER_PAGE = 6;
export const CHECKS_PER_PAGE = SLOTS_PER_PAGE - 1;
export const MAX_CHECKS_AUTHENTICATED = 100;

const Page = (props: HomePageProps) => <HomePage {...props} />;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const strings = getLocaleStrings(localeSubset, context.locale);
  let data;
  if (context.req.cookies.authToken) {
    const decodedToken = await getAuthUser(context);
    if (decodedToken !== null) {
      data = await dbAdmin.runTransaction(async (transaction) => {
        const userDoc = dbAdmin.collection("users").doc(decodedToken.uid);
        const userData = (await transaction.get(userDoc)).data() as UserAdmin | undefined;
        if (typeof userData !== "undefined") {
          let allCheckIds: string[] = [];
          const checks: CheckPreviewType[] = [];
          if (userData.checks?.length) {
            allCheckIds = userData.checks.map((check) => check.id);
            // Leave one spot to create a new check
            const userChecks = userData.checks.slice(CHECKS_PER_PAGE * -1);
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
                    users: checkData.users,
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
  return { props: { allCheckIds: [], checks: [], strings, ...data } };
});

export default Page;
