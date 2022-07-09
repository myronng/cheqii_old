import { styled } from "@mui/material/styles";
import { AuthType, useAuth } from "components/AuthContextProvider";
import { CheckDisplay, CheckDisplayRef } from "components/check/CheckDisplay";
import { CheckHeader } from "components/check/CheckHeader";
import { redirect } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { AccessType, AuthUser, BaseProps, Check, UserAdmin } from "declarations";
import { FieldValue } from "firebase-admin/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import localeSubset from "locales/check.json";
import { InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { getAuthUser } from "services/authenticator";
import { UnauthorizedError, ValidationError } from "services/error";
import { db } from "services/firebase";
import { dbAdmin } from "services/firebaseAdmin";
import { formatAccessLink } from "services/formatter";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";
import { checkToCheckStates } from "services/transformer";

export type ShareClickHandler = MouseEventHandler<HTMLButtonElement>;

const USER_ACCESS: AccessType[] = ["owner", "editor", "viewer"];

const Page = styled(
  (
    props: InferGetServerSidePropsType<typeof getServerSideProps> & Pick<BaseProps, "className">
  ) => {
    const router = useRouter();
    const locale = router.locale ?? String(router.defaultLocale);
    const { setLoading } = useLoading();
    const { setSnackbar } = useSnackbar();
    const currentUserInfo = useAuth() as Required<AuthType>; // Only authenticated users can enter
    const checkStates = checkToCheckStates(props.check, locale);
    const [checkData, setCheckData] = useState(checkStates.checkData);
    const [checkSettings, setCheckSettings] = useState(checkStates.checkSettings);
    const currentUserAccess = USER_ACCESS.reduce(
      (prevAccessType, accessType, rank) =>
        checkSettings[accessType][currentUserInfo.uid] ? rank : prevAccessType,
      USER_ACCESS.length - 1
    ); // Start at lowest access until verified
    const writeAccess = !checkSettings.invite.required || currentUserAccess < 2;
    const accessLink = formatAccessLink(
      // Viewers may not view/share invite links
      !writeAccess ? false : checkSettings.invite.required,
      props.id,
      checkSettings.invite.id
    );
    const unsubscribe = useRef(() => {});
    const checkDisplayRef = useRef<CheckDisplayRef>(null);

    const handleShareClick: ShareClickHandler = useCallback(async () => {
      try {
        await navigator.share({
          title: checkSettings.title,
          text: checkDisplayRef.current?.paymentsStrings.join("\n"),
          url: accessLink,
        });
      } catch (err) {
        navigator.clipboard.writeText(accessLink);
        setSnackbar({
          active: true,
          message: props.strings["linkCopied"],
          type: "success",
        });
      }
    }, [accessLink, checkSettings, props.strings, setSnackbar]);

    useEffect(() => {
      unsubscribe.current = onSnapshot(
        doc(db, "checks", props.id),
        (snapshot) => {
          if (!snapshot.metadata.hasPendingWrites) {
            const snapshotData = snapshot.data() as Check;
            if (typeof snapshotData !== "undefined") {
              const snapshotStates = checkToCheckStates(snapshotData, locale);
              setCheckData(snapshotStates.checkData);
              setCheckSettings(snapshotStates.checkSettings);
            } else {
              unsubscribe.current();
            }
          }
        },
        (err) => {
          if (err.code === "permission-denied") {
            unsubscribe.current();
            redirect(setLoading, "/");
          } else {
            setSnackbar({
              active: true,
              message: err,
              type: "error",
            });
          }
        }
      );

      return () => {
        unsubscribe.current();
      };
    }, [locale, props.id, setLoading, setSnackbar]);

    return (
      <div className={props.className}>
        <CheckHeader
          accessLink={accessLink}
          checkSettings={checkSettings}
          checkId={props.id}
          onShareClick={handleShareClick}
          setCheckSettings={setCheckSettings}
          strings={props.strings}
          unsubscribe={unsubscribe.current}
          userAccess={currentUserAccess}
          writeAccess={writeAccess}
        />
        <CheckDisplay
          checkData={checkData}
          checkId={props.id}
          onShareClick={handleShareClick}
          ref={checkDisplayRef}
          setCheckData={setCheckData}
          strings={props.strings}
          writeAccess={writeAccess}
        />
      </div>
    );
  }
)`
  display: flex;
  flex-direction: column;
`;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const strings = getLocaleStrings(localeSubset, context.locale);
  const data = await dbAdmin.runTransaction(async (transaction) => {
    if (typeof context.query.checkId !== "string") {
      throw new ValidationError(strings["invalidQuery"]);
    }
    const authUser = await getAuthUser(context);
    if (authUser !== null) {
      const checkRef = dbAdmin.collection("checks").doc(context.query.checkId);
      const check = await transaction.get(checkRef);
      const checkData = check.data();
      if (typeof checkData !== "undefined") {
        const restricted = checkData.invite.required;
        const userDoc = dbAdmin.collection("users").doc(authUser.uid);
        // Transaction reads must be before writes
        const userData = (await transaction.get(userDoc)).data() as UserAdmin | undefined;

        if (restricted === true) {
          if (context.query.inviteId === checkData.invite.id) {
            const userData: Partial<AuthUser> = {};
            if (authUser.displayName) {
              userData.displayName = authUser.displayName;
            }
            if (authUser.email) {
              userData.email = authUser.email;
            }
            if (authUser.photoURL) {
              userData.photoURL = authUser.photoURL;
            }

            // Make sure editor invites won't overwrite owner access
            if (checkData.invite.type === "editor" && !checkData.owner[authUser.uid]) {
              // Add user as editor if not an owner
              const editor = {
                ...checkData.editor,
                [authUser.uid]: userData,
              }; // Use spread to force into object if undefined
              // Promote viewers to editor if using an editor invite
              const viewer = { ...checkData.viewer };
              delete viewer[authUser.uid];
              transaction.set(
                checkRef,
                {
                  editor,
                  viewer,
                },
                { merge: true }
              );
            } else if (
              checkData.invite.type === "viewer" &&
              !checkData.owner[authUser.uid] &&
              !checkData.editor[authUser.uid]
            ) {
              // Add user as viewer if not an owner or editor
              const viewer = {
                ...checkData.viewer,
                [authUser.uid]: userData,
              };
              transaction.set(
                checkRef,
                {
                  viewer,
                },
                { merge: true }
              );
            }
          } else if (
            // Throw if restricted and not authorized
            !checkData.owner[authUser.uid] &&
            !checkData.editor[authUser.uid] &&
            !checkData.viewer[authUser.uid]
          ) {
            throw new UnauthorizedError();
          }
        }
        // If check reference doesn't exist in user's check array, add it in
        if (!userData?.checks?.some((check) => check.id === checkRef.id)) {
          transaction.set(
            userDoc,
            {
              checks: FieldValue.arrayUnion(checkRef),
            },
            { merge: true }
          );
        }
        return {
          auth: authUser,
          check: checkData,
          id: context.query.checkId,
        };
      }
    } else {
      throw new UnauthorizedError();
    }
  });
  return {
    props: { ...data, strings },
  };
});

export default Page;
