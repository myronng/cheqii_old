import { CheckPage } from "components/check";
import { Check, CheckUsers, UserAdmin } from "declarations";
import localeSubset from "locales/check.json";
import { InferGetServerSidePropsType } from "next";
import { getAuthUser } from "services/authenticator";
import { CHECKS_PER_PAGE } from "services/constants";
import { UnauthorizedError, ValidationError } from "services/error";
import { converter, dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

export type CheckPageProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const Page = (props: CheckPageProps) => <CheckPage {...props} />;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const strings = getLocaleStrings(localeSubset, context.locale);
  const data = await dbAdmin.runTransaction(async (transaction) => {
    if (typeof context.query.checkId !== "string") {
      throw new ValidationError(strings["invalidQuery"]);
    }
    const authUser = await getAuthUser(context.req.headers.authorization);
    if (!authUser) {
      throw new UnauthorizedError();
    }
    const checkRef = dbAdmin
      .collection("checks")
      .doc(context.query.checkId)
      .withConverter(converter<Check>());
    const userDoc = dbAdmin.collection("users").doc(authUser.uid);
    // Transaction reads must be before writes
    const userData = ((await transaction.get(userDoc)).data() as UserAdmin) || {};
    if (typeof userData.checks?.length !== "undefined") {
      if (
        !userData.checks.some((check) => check.id === checkRef.id) &&
        authUser.isAnonymous &&
        userData.checks.length >= CHECKS_PER_PAGE
      ) {
        return {
          redirect: {
            permanent: false,
            destination: "/",
          },
        };
      }
    }
    const check = await transaction.get(checkRef);
    const checkData = check.data();
    if (typeof checkData === "undefined") {
      throw new UnauthorizedError();
    }
    const restricted = checkData.invite.required;
    const newCheckData: Partial<Check> = {};

    if (restricted === true) {
      const isOwner = checkData.owner.includes(authUser.uid);
      const isEditor = checkData.editor.includes(authUser.uid);
      const isViewer = checkData.viewer.includes(authUser.uid);
      if (context.query.inviteId === checkData.invite.id) {
        // Make sure editor invites won't overwrite owner access
        if (checkData.invite.type === "editor" && !isOwner && !isEditor) {
          newCheckData.editor = checkData.editor.concat(authUser.uid); // Add user as editor if not an owner
          newCheckData.viewer = checkData.viewer.filter((userId) => userId !== authUser.uid); // Promote viewers to editor if using an editor invite;
        } else if (checkData.invite.type === "viewer" && !isOwner && !isEditor && !isViewer) {
          newCheckData.viewer = checkData.viewer.concat(authUser.uid); // Add user as viewer if not an owner or editor
        }
      } else if (
        // Throw if restricted and not authorized
        !isOwner &&
        !isEditor &&
        !isViewer
      ) {
        throw new UnauthorizedError();
      }
    }
    if (!(authUser.uid in checkData.users)) {
      const checkUserData: CheckUsers[keyof CheckUsers] = {};
      if (userData.displayName) {
        checkUserData.displayName = userData.displayName;
      }
      if (userData.email) {
        checkUserData.email = userData.email;
      }
      if (userData.photoURL) {
        checkUserData.photoURL = userData.photoURL;
      }
      if (userData.payment) {
        checkUserData.payment;
      }
      newCheckData.users = {
        ...checkData.users,
        [authUser.uid]: checkUserData,
      };
    }
    if (Object.keys(newCheckData).length > 0) {
      transaction.set(checkRef, newCheckData, { merge: true });
    }
    // If user doesn't have userData or a check array (new/anonymous users), create one
    if (typeof userData?.checks === "undefined") {
      transaction.set(
        userDoc,
        {
          checks: [checkRef],
        },
        { merge: true }
      );
    } else if (!userData?.checks?.some((check) => check.id === checkRef.id)) {
      // If check reference doesn't exist in user's check array, add it in to the front to sort by most recently created
      transaction.set(
        userDoc,
        {
          checks: [checkRef, ...userData.checks],
        },
        { merge: true }
      );
    }
    return {
      props: { auth: authUser, check: checkData, id: context.query.checkId, strings },
    };
  });
  return data;
});

export default Page;
