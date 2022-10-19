import { useMediaQuery } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { Body, BodyProps } from "components/check/Body";
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
import { getLocale } from "services/locale";
import { checkToCheckStates } from "services/transformer";

export type ShareClickHandler = MouseEventHandler<HTMLButtonElement>;

const USER_ACCESS: AccessType[] = ["owner", "editor", "viewer"];

export const CheckPage = styled((props: CheckPageProps) => {
  const router = useRouter();
  const locale = getLocale(router);
  const theme = useTheme();
  const { setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const { userInfo: currentUserInfo } = useAuth();
  const checkStates = checkToCheckStates(props.check, locale);
  const [checkData, setCheckData] = useState(checkStates.checkData);
  const [checkSettings, setCheckSettings] = useState(checkStates.checkSettings);
  const [hash, setHash] = useState(typeof window !== "undefined" ? window.location.hash : "#");
  const [showTitleSm, setShowTitleSm] = useState(true);
  const downSm = useMediaQuery(theme.breakpoints.down("sm"));
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

  const handleBodyScroll: BodyProps["onScroll"] = (e) => {
    if (downSm) {
      setShowTitleSm(e.currentTarget.scrollTop === 0);
    }
  };

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

  useEffect(() => {
    const onWindowHashChange: WindowEventHandlers["onhashchange"] = (_e) => {
      setHash(window.location.hash);
    };
    window.addEventListener("hashchange", onWindowHashChange);

    return () => {
      window.removeEventListener("hashchange", onWindowHashChange);
    };
  }, []);

  return (
    <div className={props.className}>
      <Header
        accessLink={accessLink}
        checkSettings={checkSettings}
        checkId={props.id}
        downSm={downSm}
        setCheckSettings={setCheckSettings}
        settingsOpen={hash === "#settings"}
        showTitle={showTitleSm}
        strings={props.strings}
        unsubscribe={unsubscribe.current}
        userAccess={currentUserAccess}
        writeAccess={writeAccess}
      />
      <Body
        accessLink={accessLink}
        checkData={checkData}
        checkId={props.id}
        checkUsers={checkSettings.users}
        onScroll={handleBodyScroll}
        setCheckData={setCheckData}
        strings={props.strings}
        title={checkSettings.title}
        writeAccess={writeAccess}
      />
    </div>
  );
})`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;
