import { CheckPage } from "components/check";
import { AuthUser, Check, UserAdmin } from "declarations";
import localeSubset from "locales/check.json";
import { InferGetServerSidePropsType } from "next";
import { CHECKS_PER_PAGE, MAX_CHECKS_AUTHENTICATED } from "pages";
import { getAuthUser } from "services/authenticator";
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
    const authUser = await getAuthUser(context);
    if (authUser === null) {
      throw new UnauthorizedError();
    }
    const userDoc = dbAdmin.collection("users").doc(authUser.uid);
    // Transaction reads must be before writes
    const userData = (await transaction.get(userDoc)).data() as UserAdmin | undefined;
    if (typeof userData?.checks?.length !== "undefined") {
      if (
        (authUser.isAnonymous && userData.checks.length >= CHECKS_PER_PAGE) ||
        (!authUser.isAnonymous && userData.checks.length >= MAX_CHECKS_AUTHENTICATED)
      ) {
        return {
          redirect: {
            permanent: false,
            destination: "/",
          },
        };
      }
    }
    const checkRef = dbAdmin
      .collection("checks")
      .doc(context.query.checkId)
      .withConverter(converter<Check>());
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
      const checkUserData: Partial<AuthUser> = {};
      if (authUser.displayName) {
        checkUserData.displayName = authUser.displayName;
      }
      if (authUser.email) {
        checkUserData.email = authUser.email;
      }
      if (authUser.photoURL) {
        checkUserData.photoURL = authUser.photoURL;
      }
      newCheckData.users = {
        ...checkData.users,
        [authUser.uid]: checkUserData,
      };
    }
    if (Object.keys(newCheckData).length > 0) {
      transaction.set(checkRef, newCheckData, { merge: true });
    }
    // If check reference doesn't exist in user's check array, add it in
    if (
      typeof userData?.checks !== "undefined" &&
      !userData.checks.some((check) => check.id === checkRef.id)
    ) {
      transaction.set(
        userDoc,
        {
          checks: [checkRef, ...userData.checks],
        },
        { merge: true }
      );
    }
    return {
      auth: authUser,
      check: checkData,
      id: context.query.checkId,
    };
  });
  return {
    props: { ...data, strings },
  };
});

export default Page;
