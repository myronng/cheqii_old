import { ArrowBack, PersonAdd, Settings, Share } from "@mui/icons-material";
import { IconButton, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { ActionButton } from "components/ActionButton";
import { CheckDisplay, CheckDisplayProps, TotalsHandle } from "components/check/CheckDisplay";
import { CheckSettings, CheckSettingsProps } from "components/check/CheckSettings";
import { CheckSummary, CheckSummaryProps } from "components/check/CheckSummary";
import { LinkIconButton, redirect } from "components/Link";
import { AccessType, AuthUser, BaseProps, Check, UserAdmin } from "declarations";
import { arrayRemove, doc, onSnapshot, updateDoc, writeBatch } from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";
import localeSubset from "locales/check.json";
import { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import {
  ChangeEventHandler,
  FocusEventHandler,
  MouseEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import { getAuthUser } from "services/authenticator";
import { UnauthorizedError, ValidationError } from "services/error";
import { db, generateUid } from "services/firebase";
import { dbAdmin } from "services/firebaseAdmin";
import { formatAccessLink, interpolateString } from "services/formatter";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";
import { AuthType, useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

const USER_ACCESS: AccessType[] = ["owner", "editor", "viewer"];

const Page = styled(
  (
    props: InferGetServerSidePropsType<typeof getServerSideProps> & Pick<BaseProps, "className">
  ) => {
    const { loading, setLoading } = useLoading();
    const { setSnackbar } = useSnackbar();
    const currentUserInfo = useAuth() as Required<AuthType>; // Only authenticated users can enter
    const [checkData, setCheckData] = useState<Check>(props.data);
    const currentUserAccess = USER_ACCESS.reduce((prevAccessType, accessType, rank) => {
      if (checkData[accessType][currentUserInfo.uid]) {
        return rank;
      } else {
        return prevAccessType;
      }
    }, USER_ACCESS.length - 1); // Start at lowest access until verified
    // const currentUserAccess = 2;
    const [checkSettingsOpen, setCheckSettingsOpen] = useState(false);
    const [checkSummaryContributor, setCheckSummaryContributor] = useState(-1);
    const [checkSummaryOpen, setCheckSummaryOpen] = useState(false); // Use separate open state so data doesn't clear during dialog animation
    const writeAccess = !checkData.invite.required || currentUserAccess < 2;
    const [accessLink, setAccessLink] = useState(
      formatAccessLink(
        // Viewers may not view/share invite links
        !writeAccess ? false : props.data.invite.required,
        props.id,
        props.data.invite.id
      )
    );
    const unsubscribe = useRef(() => {});
    const totalsRef = useRef<TotalsHandle | null>(null);

    const handleContributorSummaryClick: CheckDisplayProps["onContributorSummaryClick"] = (
      contributorIndex
    ) => {
      setCheckSummaryOpen(true);
      setCheckSummaryContributor(contributorIndex);
    };

    const handleSettingsDialogClose: CheckSettingsProps["onClose"] = (_e, _reason) => {
      setCheckSettingsOpen(false);
    };

    const handleSettingsDialogOpen: MouseEventHandler<HTMLButtonElement> = (_e) => {
      setCheckSettingsOpen(true);
    };

    const handleShareClick: CheckSettingsProps["onShareClick"] = async (_e) => {
      try {
        await navigator.share({
          title: checkData.title,
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
    };

    const handleSummaryDialogClose: CheckSummaryProps["onClose"] = (_e, _reason) => {
      setCheckSummaryOpen(false);
    };

    let handleTitleBlur: FocusEventHandler<HTMLInputElement> | undefined;
    let handleTitleChange: ChangeEventHandler<HTMLInputElement> | undefined;

    useEffect(() => {
      unsubscribe.current = onSnapshot(
        doc(db, "checks", props.id),
        (snapshot) => {
          if (!snapshot.metadata.hasPendingWrites) {
            const snapshotData = snapshot.data() as Check;
            if (typeof snapshotData !== "undefined") {
              setCheckData(snapshotData);

              setAccessLink(
                formatAccessLink(
                  !writeAccess ? false : snapshotData.invite.required ?? checkData.invite.required, // If no write access, format as share link, else check if snapshot has restrictions, else fall back to current restriction
                  props.id,
                  snapshotData.invite.id ?? checkData.invite.id // Fall back to current invite ID
                )
              );
              // if (totalsRef.current !== null) {
              //   const target = totalsRef.current.getTarget();
              //   if (target !== null) {
              //     const targetIdentifiers = target.id.split("-");
              //     if (typeof targetIdentifiers !== "undefined") {
              //       const category = targetIdentifiers[0];
              //       if (category === "name" || category === "cost" || category === "buyer") {
              //         if (!snapshotData.items?.some((item) => item.id === targetIdentifiers[1])) {
              //           totalsRef.current?.toggleTarget(target, false);
              //         }
              //       } else if (category === "contributor") {
              //         if (
              //           !snapshotData.contributors?.some(
              //             (contributor) => contributor.id === targetIdentifiers[1]
              //           )
              //         ) {
              //           totalsRef.current?.toggleTarget(target, false);
              //         }
              //       } else if (category === "split") {
              //         if (
              //           !snapshotData.items?.some((item) => item.id === targetIdentifiers[1]) ||
              //           !snapshotData.contributors?.some(
              //             (contributor) => contributor.id === targetIdentifiers[2]
              //           )
              //         ) {
              //           totalsRef.current?.toggleTarget(target, false);
              //         }
              //       }
              //     }
              //     console.log(targetIdentifiers, snapshotData);
              //   }
              // }
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
    }, []);

    let renderMain;
    if (writeAccess) {
      const handleAddContributorClick = async () => {
        const timestamp = Date.now();
        const newCheckData = { ...checkData, updatedAt: timestamp };
        newCheckData.contributors.push({
          id: generateUid(),
          name: interpolateString(props.strings["contributorIndex"], {
            index: (checkData.contributors.length + 1).toString(),
          }),
        });
        newCheckData.items.forEach((item) => {
          item.split.push(0);
        });
        setCheckData(newCheckData);

        const checkDoc = doc(db, "checks", props.id);
        updateDoc(checkDoc, {
          contributors: newCheckData.contributors,
          items: newCheckData.items,
          updatedAt: timestamp,
        });
      };

      const handleAddItemClick = () => {
        const timestamp = Date.now();
        const newCheckData = { ...checkData, updatedAt: timestamp };
        newCheckData.items.push({
          buyer: 0,
          cost: 0,
          id: generateUid(),
          name: interpolateString(props.strings["itemIndex"], {
            index: (checkData.items.length + 1).toString(),
          }),
          split: checkData.contributors.map(() => 1),
        });
        setCheckData(newCheckData);
        const checkDoc = doc(db, "checks", props.id);
        updateDoc(checkDoc, {
          items: newCheckData.items,
          updatedAt: timestamp,
        });
      };

      const handleBuyerBlur: CheckDisplayProps["onBuyerBlur"] = async (e, itemIndex) => {
        try {
          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            items: checkData.items,
            updatedAt: Date.now(),
          });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleBuyerChange: CheckDisplayProps["onBuyerChange"] = (e, itemIndex) => {
        const newCheckData = { ...checkData };
        newCheckData.items[itemIndex].buyer = e.target.selectedIndex;
        setCheckData(newCheckData);
      };

      const handleContributorBlur: CheckDisplayProps["onContributorBlur"] = async (
        e,
        contributorIndex
      ) => {
        try {
          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            contributors: checkData.contributors,
            updatedAt: Date.now(),
          });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleContributorChange: CheckDisplayProps["onContributorChange"] = (
        e,
        contributorIndex
      ) => {
        const newCheckData = { ...checkData };
        newCheckData.contributors[contributorIndex].name = e.target.value;
        setCheckData(newCheckData);
      };

      const handleContributorDelete: CheckDisplayProps["onContributorDelete"] = async (
        _e,
        contributorIndex
      ) => {
        try {
          const timestamp = Date.now();
          const newCheckData = { ...checkData, updatedAt: timestamp };
          newCheckData.contributors = checkData.contributors.filter(
            (_value, contributorFilterIndex) => contributorFilterIndex !== contributorIndex
          );
          newCheckData.items = checkData.items.map((item) => {
            const newItem = { ...item };
            if (item.buyer === contributorIndex) {
              newItem.buyer = 0;
            }
            const newSplit = item.split.filter(
              (_value, splitFilterIndex) => splitFilterIndex !== contributorIndex
            );
            newItem.split = newSplit;

            return newItem;
          });
          setCheckData(newCheckData);

          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            contributors: newCheckData.contributors,
            items: newCheckData.items,
            updatedAt: timestamp,
          });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleCostBlur: CheckDisplayProps["onCostBlur"] = async (e, itemIndex) => {
        try {
          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            items: checkData.items,
            updatedAt: Date.now(),
          });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleCostChange: CheckDisplayProps["onCostChange"] = (_e, itemIndex, rawValue) => {
        const newCheckData = { ...checkData };
        newCheckData.items[itemIndex].cost = rawValue;
        setCheckData(newCheckData);
      };

      const handleDeleteCheckClick: CheckSettingsProps["onDeleteCheckClick"] = async (
        newCheckData
      ) => {
        unsubscribe.current();
        if (props.userAccess === 0) {
          // Use admin to perform deletes that affects multiple user documents in DB
          const response = await fetch(`/api/check/${props.id}`, {
            method: "DELETE",
          });
          if (response.status === 200) {
            redirect(setLoading, "/");
          }
        } else {
          // Non-owners can only leave the check; no admin usage required
          const batch = writeBatch(db);
          const checkDoc = doc(db, "checks", props.id);
          batch.update(doc(db, "users", currentUserInfo.uid), {
            checks: arrayRemove(checkDoc),
          });
          batch.update(checkDoc, {
            ...newCheckData,
            updatedAt: Date.now(),
          });
          await batch.commit();
          redirect(setLoading, "/");
        }
      };

      const handleInviteTypeChange: CheckSettingsProps["onInviteTypeChange"] = async (
        newInviteType
      ) => {
        const timestamp = Date.now();
        const newCheckData = { ...checkData, updatedAt: timestamp };
        newCheckData.invite.type = newInviteType;
        setCheckData(newCheckData);
        const checkDoc = doc(db, "checks", props.id);
        // Don't await update, allow user interaction immediately
        updateDoc(checkDoc, {
          "invite.type": newInviteType,
          updatedAt: timestamp,
        });
      };

      const handleItemDelete: CheckDisplayProps["onItemDelete"] = async (_e, itemIndex) => {
        try {
          const timestamp = Date.now();
          const newCheckData = { ...checkData, updatedAt: timestamp };
          newCheckData.items = checkData.items.filter(
            (_value, filterIndex) => filterIndex !== itemIndex
          );

          setCheckData(newCheckData);
          // const checkDoc = doc(db, "checks", props.id);
          // updateDoc(checkDoc, {
          //   items: newCheckData.items,
          //   updatedAt: timestamp,
          // });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleNameBlur: CheckDisplayProps["onNameBlur"] = async (e, itemIndex) => {
        try {
          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            items: checkData.items,
            updatedAt: Date.now(),
          });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleNameChange: CheckDisplayProps["onNameChange"] = (e, itemIndex) => {
        const newCheckData = { ...checkData };
        newCheckData.items[itemIndex].name = e.target.value;
        setCheckData(newCheckData);
      };

      const handleRegenerateInviteLinkClick: CheckSettingsProps["onRegenerateInviteLinkClick"] =
        () => {
          const timestamp = Date.now();
          const newInviteId = generateUid();
          const newCheckData = { ...checkData, updatedAt: timestamp };
          newCheckData.invite.id = newInviteId;
          setCheckData(newCheckData);
          setAccessLink(formatAccessLink(true, props.id, newInviteId));
          setSnackbar({
            active: true,
            autoHideDuration: 3500,
            message: props.strings["inviteLinkRegenerated"],
            type: "success",
          });
          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            "invite.id": newInviteId,
            updatedAt: timestamp,
          });
        };

      const handleRemoveUserClick: CheckSettingsProps["onRemoveUserClick"] = async (
        removedUser
      ) => {
        await fetch(`/api/check/${props.id}/user/${removedUser}`, {
          method: "DELETE",
        });
      };

      const handleRestrictionChange: CheckSettingsProps["onRestrictionChange"] = (
        _e,
        newRestricted
      ) => {
        const timestamp = Date.now();
        const newCheckData = { ...checkData, updatedAt: timestamp };
        newCheckData.invite.required = newRestricted;
        setCheckData(newCheckData);
        setAccessLink(
          formatAccessLink(!writeAccess ? false : newRestricted, props.id, checkData.invite.id)
        );
        const checkDoc = doc(db, "checks", props.id);
        updateDoc(checkDoc, {
          "invite.required": newRestricted, // Only update the single node instead of sending the entire newCheckData
          updatedAt: timestamp,
        });
      };

      const handleSplitBlur: CheckDisplayProps["onSplitBlur"] = async (
        e,
        itemIndex,
        contributorIndex
      ) => {
        try {
          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            items: checkData.items,
            updatedAt: Date.now(),
          });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleSplitChange: CheckDisplayProps["onSplitChange"] = (
        _e,
        itemIndex,
        contributorIndex,
        rawValue
      ) => {
        const newCheckData = { ...checkData };
        newCheckData.items[itemIndex].split[contributorIndex] = rawValue;
        setCheckData(newCheckData);
      };

      handleTitleBlur = async (_e) => {
        try {
          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            title: checkData.title,
            updatedAt: Date.now(),
          });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      handleTitleChange = (e) => {
        const newCheckData = { ...checkData, title: e.target.value };
        setCheckData(newCheckData);
      };

      const handleUserAccessChange: CheckSettingsProps["onUserAccessChange"] = async (
        newCheckData
      ) => {
        const timestamp = Date.now();
        newCheckData.updatedAt = timestamp;
        setCheckData(newCheckData);
        const checkDoc = doc(db, "checks", props.id);
        updateDoc(checkDoc, {
          editor: newCheckData.editor,
          owner: newCheckData.owner,
          updatedAt: timestamp,
          viewer: newCheckData.viewer,
        });
        // Opt to shallow copy objects in JS for reusability when setting state as opposed to the following code
        // updateDoc(checkDoc, {
        //   [`${currentAccess}.${currentUid}`]: deleteField(),
        //   [`${newAccess}.${currentUid}`]: currentUserData,
        // });
      };
      // TODO: Fix adding to display; input state doesn't sync
      // TODO: Fix removing from display; too few useState hooks --> encapsulate in separate component

      renderMain = (
        <>
          <CheckDisplay
            checkData={checkData}
            className="Body-root"
            loading={loading.active}
            onBuyerBlur={handleBuyerBlur}
            onBuyerChange={handleBuyerChange}
            onContributorBlur={handleContributorBlur}
            onContributorChange={handleContributorChange}
            onContributorDelete={handleContributorDelete}
            onContributorSummaryClick={handleContributorSummaryClick}
            onCostBlur={handleCostBlur}
            onCostChange={handleCostChange}
            onItemDelete={handleItemDelete}
            onNameBlur={handleNameBlur}
            onNameChange={handleNameChange}
            onSplitBlur={handleSplitBlur}
            onSplitChange={handleSplitChange}
            ref={totalsRef}
            strings={props.strings}
            writeAccess={writeAccess}
          />
          <ActionButton
            label={props.strings["addItem"]}
            onClick={handleAddItemClick}
            subActions={[
              {
                Icon: PersonAdd,
                label: props.strings["addContributor"],
                onClick: handleAddContributorClick,
              },
              {
                Icon: Share,
                label: props.strings["share"],
                onClick: handleShareClick,
              },
            ]}
          />
          <CheckSettings
            accessLink={accessLink}
            checkData={checkData}
            onClose={handleSettingsDialogClose}
            onDeleteCheckClick={handleDeleteCheckClick}
            onInviteTypeChange={handleInviteTypeChange}
            onRegenerateInviteLinkClick={handleRegenerateInviteLinkClick}
            onRemoveUserClick={handleRemoveUserClick}
            onRestrictionChange={handleRestrictionChange}
            onShareClick={handleShareClick}
            onUserAccessChange={handleUserAccessChange}
            open={checkSettingsOpen}
            strings={props.strings}
            userAccess={currentUserAccess}
            writeAccess={writeAccess}
          />
        </>
      );
    } else {
      renderMain = (
        <>
          <CheckDisplay
            checkData={checkData}
            className="Body-root"
            loading={loading.active}
            onContributorSummaryClick={handleContributorSummaryClick}
            ref={totalsRef}
            strings={props.strings}
            writeAccess={writeAccess}
          />
          <ActionButton Icon={Share} label={props.strings["share"]} onClick={handleShareClick} />
          <CheckSettings
            accessLink={accessLink}
            checkData={checkData}
            onClose={handleSettingsDialogClose}
            onShareClick={handleShareClick}
            open={checkSettingsOpen}
            strings={props.strings}
            userAccess={currentUserAccess}
            writeAccess={writeAccess}
          />
        </>
      );
    }
    return (
      <div className={props.className}>
        <Head>
          <title>{checkData.title}</title>
        </Head>
        <header className="Header-root">
          <LinkIconButton className="Header-back" NextLinkProps={{ href: "/" }}>
            <ArrowBack />
          </LinkIconButton>
          <TextField
            className="Header-title"
            disabled={loading.active || !writeAccess}
            label={props.strings["name"]}
            onBlur={handleTitleBlur}
            onChange={handleTitleChange}
            size="small"
            value={checkData.title}
          />
          <IconButton
            className="Header-settings"
            disabled={loading.active}
            onClick={handleSettingsDialogOpen}
          >
            <Settings />
          </IconButton>
          <Account onSignOut={unsubscribe.current} strings={props.strings} />
        </header>
        {renderMain}
        <CheckSummary
          checkData={checkData}
          currentContributor={checkSummaryContributor}
          onClose={handleSummaryDialogClose}
          open={checkSummaryOpen}
          strings={props.strings}
        />
      </div>
    );
  }
)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;

    & .Body-root {
      overflow: auto;
    }

    & .Header-root {
      display: flex;
      margin: ${theme.spacing(2)};
    }

    & .Header-settings {
      margin-left: auto;
      margin-right: ${theme.spacing(2)};
    }

    & .Header-title {
      align-items: center;
      display: inline-flex;
      margin-left: ${theme.spacing(2)};
    }
  `}
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
          data: checkData,
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
