import { CheckPreviewType, HomePage, HomePageProps } from "components/home";
import { Check, UserAdmin } from "declarations";
import { FieldPath, FieldValue } from "firebase-admin/firestore";
import localeSubset from "locales/index.json";
import { getAuthUser } from "services/authenticator";
import { CHECKS_PER_PAGE } from "services/constants";
import { dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

const Page = (props: HomePageProps) => <HomePage {...props} />;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const strings = getLocaleStrings(localeSubset, context.locale);
  let data;
  const authUser = await getAuthUser(context);
  console.log(authUser);
  if (authUser) {
    data = await dbAdmin.runTransaction(async (transaction) => {
      const userDoc = dbAdmin.collection("users").doc(authUser.uid);
      const userData = (await transaction.get(userDoc)).data() as UserAdmin | undefined;
      if (typeof userData !== "undefined") {
        let allCheckIds: string[] = [];
        const checks: CheckPreviewType[] = [];
        if (userData.checks?.length) {
          allCheckIds = userData.checks.map((check) => check.id);
          // Leave one spot to create a new check
          const checkDocs = await dbAdmin
            .collection("checks")
            .where(FieldPath.documentId(), "in", allCheckIds)
            .limit(CHECKS_PER_PAGE)
            .get();
          const prunedChecks: UserAdmin["checks"] = [];
          checkDocs.forEach((check) => {
            const checkData = check.data() as Check;
            if (typeof checkData !== "undefined") {
              checks.push({
                data: checkData,
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
          auth: authUser,
          checks,
        };
      }
    });
  }
  return { props: { allCheckIds: [], checks: [], reauth: authUser === false, strings, ...data } };
});

export default Page;
