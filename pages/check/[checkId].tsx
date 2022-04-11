import { ArrowBack, PersonAdd, Settings, Share } from "@mui/icons-material";
import { IconButton, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { ActionButton } from "components/ActionButton";
import { CheckDisplay, CheckDisplayProps, TotalsHandle } from "components/check/CheckDisplay";
import { CheckSettings, CheckSettingsProps } from "components/check/CheckSettings";
import { CheckSummary, CheckSummaryProps } from "components/check/CheckSummary";
import { LinkIconButton, redirect } from "components/Link";
import { AccessType, AuthUser, BaseProps, Check, CheckInput, UserAdmin } from "declarations";
import { Currency } from "dinero.js";
import { arrayRemove, doc, onSnapshot, updateDoc, writeBatch } from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";
import localeSubset from "locales/check.json";
import { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
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
import {
  formatAccessLink,
  formatCurrency,
  formatInteger,
  interpolateString,
} from "services/formatter";
import { getCurrencyType, getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";
import { parseNumericFormat, parseCurrencyAmount, parseRatioAmount } from "services/parser";
import { AuthType, useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

const USER_ACCESS: AccessType[] = ["owner", "editor", "viewer"];

const checkToCheckInput: (locale: string, check: Check) => CheckInput = (
  locale,
  { contributors, items, title, ...check }
) => {
  const checkInput: CheckInput = {
    ...check,
    contributors: contributors.map(({ name, ...contributor }) => ({
      ...contributor,
      name: {
        clean: name,
        dirty: name,
      },
    })),
    items: items.map(({ buyer, cost, name, split, ...item }) => {
      const newCost = formatCurrency(locale, cost);
      return {
        ...item,
        buyer: {
          clean: buyer,
          dirty: buyer,
        },
        cost: {
          clean: newCost,
          dirty: newCost,
        },
        name: {
          clean: name,
          dirty: name,
        },
        split: split.map((amount) => {
          const newSplit = formatInteger(locale, amount);
          return {
            clean: newSplit,
            dirty: newSplit,
          };
        }),
      };
    }),
    title: {
      clean: title,
      dirty: title,
    },
  };
  return checkInput;
};

const checkInputToCheck: (
  locale: string,
  currency: Currency<number>,
  checkInput: CheckInput
) => Check = (locale, currency, { contributors, items, title, ...checkInput }) => {
  const check: Check = {
    ...checkInput,
    contributors: contributors.map(({ name, ...contributor }) => ({
      ...contributor,
      name: name.dirty,
    })),
    items: items.map(({ buyer, cost, name, split, ...item }) => ({
      ...item,
      buyer: buyer.dirty,
      cost: parseCurrencyAmount(locale, currency, cost.dirty),
      name: name.dirty,
      split: split.map((amount) => parseRatioAmount(locale, amount.dirty)),
    })),
    title: title.dirty,
  };
  return check;
};

const Page = styled(
  (
    props: InferGetServerSidePropsType<typeof getServerSideProps> & Pick<BaseProps, "className">
  ) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const currency = getCurrencyType(locale);
    const { loading, setLoading } = useLoading();
    const { setSnackbar } = useSnackbar();
    const currentUserInfo = useAuth() as Required<AuthType>; // Only authenticated users can enter
    const [checkData, setCheckData] = useState<CheckInput>(checkToCheckInput(locale, props.data));
    const currentUserAccess = USER_ACCESS.reduce((prevAccessType, accessType, rank) => {
      if (checkData[accessType][currentUserInfo.uid]) {
        return rank;
      } else {
        return prevAccessType;
      }
    }, USER_ACCESS.length - 1); // Start at lowest access until verified
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
          title: checkData.title.dirty,
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
              // Run checkToCheckInput twice to generate different object refs
              setCheckData(checkToCheckInput(locale, snapshotData));

              setAccessLink(
                formatAccessLink(
                  !writeAccess ? false : snapshotData.invite.required ?? checkData.invite.required, // If no write access, format as share link, else check if snapshot has restrictions, else fall back to current restriction
                  props.id,
                  snapshotData.invite.id ?? checkData.invite.id // Fall back to current invite ID
                )
              );
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
        try {
          const timestamp = Date.now();
          const stateCheckData = { ...checkData, updatedAt: timestamp };
          const formattedSplitValue = formatInteger(locale, 0);
          const newName = interpolateString(props.strings["contributorIndex"], {
            index: (checkData.contributors.length + 1).toString(),
          });
          const newContributor = {
            id: generateUid(),
            name: {
              clean: newName,
              dirty: newName,
            },
          };
          stateCheckData.contributors.push(newContributor);
          stateCheckData.items.forEach((item) => {
            item.split.push(formattedSplitValue);
          });

          const checkDoc = doc(db, "checks", props.id);
          const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
          updateDoc(checkDoc, {
            contributors: docCheckData.contributors,
            items: docCheckData.items,
            updatedAt: timestamp,
          });

          setCheckData(stateCheckData);
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleAddItemClick = async () => {
        try {
          const timestamp = Date.now();
          const stateCheckData = { ...checkData, updatedAt: timestamp };
          const newCost = formatCurrency(locale, 0);
          const newName = interpolateString(props.strings["itemIndex"], {
            index: (checkData.items.length + 1).toString(),
          });
          const newItem = {
            buyer: {
              clean: 0,
              dirty: 0,
            },
            cost: {
              clean: newCost,
              dirty: newCost,
            },
            id: generateUid(),
            name: {
              clean: newName,
              dirty: newName,
            },
            split: checkData.contributors.map(() => {
              const newSplit = formatInteger(locale, 1);
              return {
                clean: newSplit,
                dirty: newSplit,
              };
            }),
          };
          stateCheckData.items.push(newItem);

          const checkDoc = doc(db, "checks", props.id);
          const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
          updateDoc(checkDoc, {
            items: docCheckData.items,
            updatedAt: timestamp,
          });

          setCheckData(stateCheckData);
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleBuyerBlur: CheckDisplayProps["onBuyerBlur"] = async (_e, itemIndex) => {
        try {
          if (checkData.items[itemIndex].buyer.clean !== checkData.items[itemIndex].buyer.dirty) {
            const timestamp = Date.now();
            const stateCheckData = { ...checkData, updatedAt: timestamp };
            stateCheckData.items[itemIndex].buyer.clean =
              stateCheckData.items[itemIndex].buyer.dirty;

            const checkDoc = doc(db, "checks", props.id);
            const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
            updateDoc(checkDoc, {
              items: docCheckData.items,
              updatedAt: timestamp,
            });

            setCheckData(stateCheckData);
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleBuyerChange: CheckDisplayProps["onBuyerChange"] = (e, itemIndex) => {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].buyer.dirty = e.target.selectedIndex;
        setCheckData(stateCheckData);
      };

      const handleContributorBlur: CheckDisplayProps["onContributorBlur"] = async (
        _e,
        contributorIndex
      ) => {
        try {
          if (
            checkData.contributors[contributorIndex].name.clean !==
            checkData.contributors[contributorIndex].name.dirty
          ) {
            const timestamp = Date.now();
            const stateCheckData = { ...checkData, updatedAt: timestamp };
            stateCheckData.contributors[contributorIndex].name.clean =
              stateCheckData.contributors[contributorIndex].name.dirty;

            const checkDoc = doc(db, "checks", props.id);
            const docCheckData = checkInputToCheck(locale, currency, checkData);
            updateDoc(checkDoc, {
              contributors: docCheckData.contributors,
              updatedAt: timestamp,
            });

            setCheckData(stateCheckData);
          }
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
        const stateCheckData = { ...checkData };
        stateCheckData.contributors[contributorIndex].name.dirty = e.target.value;
        setCheckData(stateCheckData);
      };

      const handleContributorDelete: CheckDisplayProps["onContributorDelete"] = async (
        _e,
        contributorIndex
      ) => {
        try {
          const timestamp = Date.now();
          const stateCheckData = { ...checkData, updatedAt: timestamp };
          stateCheckData.contributors = checkData.contributors.filter(
            (_value, contributorFilterIndex) => contributorFilterIndex !== contributorIndex
          );
          stateCheckData.items = checkData.items.map((item) => {
            const newItem = { ...item };
            if (item.buyer.dirty === contributorIndex) {
              newItem.buyer.clean = 0;
              newItem.buyer.dirty = 0;
            }
            const newSplit = item.split.filter(
              (_value, splitFilterIndex) => splitFilterIndex !== contributorIndex
            );
            newItem.split = newSplit;

            return newItem;
          });

          const checkDoc = doc(db, "checks", props.id);
          const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
          updateDoc(checkDoc, {
            contributors: docCheckData.contributors,
            items: docCheckData.items,
            updatedAt: timestamp,
          });

          setCheckData(stateCheckData);
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleCostBlur: CheckDisplayProps["onCostBlur"] = async (_e, itemIndex) => {
        try {
          const rawValue = parseCurrencyAmount(
            locale,
            currency,
            checkData.items[itemIndex].cost.dirty
          );
          const timestamp = Date.now();
          const stateCheckData = { ...checkData, updatedAt: timestamp };
          stateCheckData.items[itemIndex].cost.dirty = formatCurrency(locale, rawValue);

          if (
            stateCheckData.items[itemIndex].cost.clean !==
            stateCheckData.items[itemIndex].cost.dirty
          ) {
            stateCheckData.items[itemIndex].cost.clean = stateCheckData.items[itemIndex].cost.dirty;
            const checkDoc = doc(db, "checks", props.id);
            const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
            updateDoc(checkDoc, {
              items: docCheckData.items,
              updatedAt: timestamp,
            });
          }

          setCheckData(stateCheckData);
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleCostChange: CheckDisplayProps["onCostChange"] = (e, itemIndex) => {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].cost.dirty = e.target.value;
        setCheckData(stateCheckData);
      };

      const handleCostFocus: CheckDisplayProps["onCostFocus"] = (e, itemIndex) => {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].cost.dirty = parseNumericFormat(
          locale,
          e.target.value
        ).toString();
        setCheckData(stateCheckData);
      };

      const handleDeleteCheckClick: CheckSettingsProps["onDeleteCheckClick"] = async (
        stateCheckData
      ) => {
        try {
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
              ...checkInputToCheck(locale, currency, stateCheckData),
              updatedAt: Date.now(),
            });
            await batch.commit();
            redirect(setLoading, "/");
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleInviteTypeChange: CheckSettingsProps["onInviteTypeChange"] = async (
        newInviteType
      ) => {
        try {
          const timestamp = Date.now();
          const stateCheckData = { ...checkData, updatedAt: timestamp };
          stateCheckData.invite.type = newInviteType;

          const checkDoc = doc(db, "checks", props.id);
          // Don't await update, allow user interaction immediately
          updateDoc(checkDoc, {
            "invite.type": newInviteType,
            updatedAt: timestamp,
          });

          setCheckData(stateCheckData);
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleItemDelete: CheckDisplayProps["onItemDelete"] = async (_e, itemIndex) => {
        try {
          const timestamp = Date.now();
          const stateCheckData = { ...checkData, updatedAt: timestamp };
          stateCheckData.items = checkData.items.filter(
            (_value, filterIndex) => filterIndex !== itemIndex
          );

          const checkDoc = doc(db, "checks", props.id);
          const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
          updateDoc(checkDoc, {
            items: docCheckData.items,
            updatedAt: timestamp,
          });

          setCheckData(stateCheckData);
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleNameBlur: CheckDisplayProps["onNameBlur"] = async (_e, itemIndex) => {
        try {
          if (checkData.items[itemIndex].name.clean !== checkData.items[itemIndex].name.dirty) {
            const timestamp = Date.now();
            const stateCheckData = { ...checkData, updatedAt: timestamp };
            stateCheckData.items[itemIndex].name.clean = stateCheckData.items[itemIndex].name.dirty;

            const checkDoc = doc(db, "checks", props.id);
            const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
            updateDoc(checkDoc, {
              items: docCheckData.items,
              updatedAt: timestamp,
            });

            setCheckData(stateCheckData);
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleNameChange: CheckDisplayProps["onNameChange"] = (e, itemIndex) => {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].name.dirty = e.target.value;
        setCheckData(stateCheckData);
      };

      const handleRegenerateInviteLinkClick: CheckSettingsProps["onRegenerateInviteLinkClick"] =
        async () => {
          try {
            const timestamp = Date.now();
            const newInviteId = generateUid();
            const stateCheckData = { ...checkData, updatedAt: timestamp };
            stateCheckData.invite.id = newInviteId;

            const checkDoc = doc(db, "checks", props.id);
            updateDoc(checkDoc, {
              "invite.id": newInviteId,
              updatedAt: timestamp,
            });

            setCheckData(stateCheckData);
            setAccessLink(formatAccessLink(true, props.id, newInviteId));
            setSnackbar({
              active: true,
              autoHideDuration: 3500,
              message: props.strings["inviteLinkRegenerated"],
              type: "success",
            });
          } catch (err) {
            setSnackbar({
              active: true,
              message: err,
              type: "error",
            });
          }
        };

      const handleRemoveUserClick: CheckSettingsProps["onRemoveUserClick"] = async (
        removedUser
      ) => {
        try {
          await fetch(`/api/check/${props.id}/user/${removedUser}`, {
            method: "DELETE",
          });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleRestrictionChange: CheckSettingsProps["onRestrictionChange"] = async (
        _e,
        newRestricted
      ) => {
        try {
          const timestamp = Date.now();
          const stateCheckData = { ...checkData, updatedAt: timestamp };
          stateCheckData.invite.required = newRestricted;

          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            "invite.required": newRestricted, // Only update the single node instead of sending the entire stateCheckData
            updatedAt: timestamp,
          });

          setCheckData(stateCheckData);
          setAccessLink(
            formatAccessLink(
              !writeAccess ? false : newRestricted,
              props.id,
              stateCheckData.invite.id
            )
          );
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleSplitBlur: CheckDisplayProps["onSplitBlur"] = async (
        _e,
        itemIndex,
        contributorIndex
      ) => {
        try {
          const rawValue = parseRatioAmount(
            locale,
            checkData.items[itemIndex].split[contributorIndex].dirty
          );
          const timestamp = Date.now();
          const stateCheckData = { ...checkData, updatedAt: timestamp };
          stateCheckData.items[itemIndex].split[contributorIndex].dirty = formatInteger(
            locale,
            rawValue
          );

          if (
            stateCheckData.items[itemIndex].split[contributorIndex].clean !==
            stateCheckData.items[itemIndex].split[contributorIndex].dirty
          ) {
            stateCheckData.items[itemIndex].split[contributorIndex].clean =
              stateCheckData.items[itemIndex].split[contributorIndex].dirty;
            const checkDoc = doc(db, "checks", props.id);
            const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
            updateDoc(checkDoc, {
              items: docCheckData.items,
              updatedAt: timestamp,
            });
          }
          setCheckData(stateCheckData);
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleSplitChange: CheckDisplayProps["onSplitChange"] = (
        e,
        itemIndex,
        contributorIndex
      ) => {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].split[contributorIndex].dirty = e.target.value;
        setCheckData(stateCheckData);
      };

      const handleSplitFocus: CheckDisplayProps["onSplitFocus"] = (e, itemIndex, splitIndex) => {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].split[splitIndex].dirty = parseRatioAmount(
          locale,
          e.target.value
        ).toString();
        setCheckData(stateCheckData);
      };

      handleTitleBlur = async (_e) => {
        try {
          if (checkData.title.clean !== checkData.title.dirty) {
            const timestamp = Date.now();
            const stateCheckData = { ...checkData, updatedAt: timestamp };
            stateCheckData.title.clean = stateCheckData.title.dirty;

            const checkDoc = doc(db, "checks", props.id);
            // Always convert to proper Check typing for safety
            const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
            updateDoc(checkDoc, {
              title: docCheckData.title,
              updatedAt: timestamp,
            });

            setCheckData(stateCheckData);
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      handleTitleChange = (e) => {
        const stateCheckData = { ...checkData };
        stateCheckData.title.dirty = e.target.value;
        setCheckData(stateCheckData);
      };

      const handleUserAccessChange: CheckSettingsProps["onUserAccessChange"] = async (
        stateCheckData
      ) => {
        try {
          const timestamp = Date.now();
          stateCheckData.updatedAt = timestamp;
          setCheckData(stateCheckData);
          const checkDoc = doc(db, "checks", props.id);
          const docCheckData = checkInputToCheck(locale, currency, stateCheckData);
          updateDoc(checkDoc, {
            editor: docCheckData.editor,
            owner: docCheckData.owner,
            updatedAt: timestamp,
            viewer: docCheckData.viewer,
          });
          // Opt to shallow copy objects in JS for reusability when setting state as opposed to the following code
          // updateDoc(checkDoc, {
          //   [`${currentAccess}.${currentUid}`]: deleteField(),
          //   [`${newAccess}.${currentUid}`]: currentUserData,
          // });
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
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
            onCostFocus={handleCostFocus}
            onItemDelete={handleItemDelete}
            onNameBlur={handleNameBlur}
            onNameChange={handleNameChange}
            onSplitBlur={handleSplitBlur}
            onSplitChange={handleSplitChange}
            onSplitFocus={handleSplitFocus}
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
          <title>{checkData.title.dirty}</title>
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
            value={checkData.title.dirty}
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
