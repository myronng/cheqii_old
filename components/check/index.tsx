import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { Body, BodyRef } from "components/check/Body";
import { Header } from "components/check/Header";
import { redirect } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { AccessType, Check } from "declarations";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/router";
import { CheckPageProps } from "pages/check/[checkId]";
import { MouseEventHandler, useCallback, useEffect, useRef, useState } from "react";
import { db } from "services/firebase";
import { formatAccessLink } from "services/formatter";
import { checkToCheckStates } from "services/transformer";

export type ShareClickHandler = MouseEventHandler<HTMLButtonElement>;

const USER_ACCESS: AccessType[] = ["owner", "editor", "viewer"];

export const CheckPage = styled((props: CheckPageProps) => {
  const router = useRouter();
  const locale = router.locale ?? String(router.defaultLocale);
  const { setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const { userInfo: currentUserInfo } = useAuth();
  const checkStates = checkToCheckStates(props.check, locale);
  const [checkData, setCheckData] = useState(checkStates.checkData);
  const [checkSettings, setCheckSettings] = useState(checkStates.checkSettings);
  const currentUserAccess = USER_ACCESS.reduce(
    (prevAccessType, accessType, rank) =>
      checkSettings[accessType].includes(currentUserInfo.uid ?? "") ? rank : prevAccessType, // Only authenticated users can enter
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
  const checkDisplayRef = useRef<BodyRef>(null);

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
      <Header
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
      <Body
        checkData={checkData}
        checkId={props.id}
        ref={checkDisplayRef}
        setCheckData={setCheckData}
        strings={props.strings}
        writeAccess={writeAccess}
      />
    </div>
  );
})`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;
