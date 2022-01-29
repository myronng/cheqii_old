import { ArrowBack, PersonAdd, Settings, Share } from "@mui/icons-material";
import { IconButton, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { ActionButton } from "components/ActionButton";
import { CheckDisplay, CheckDisplayProps, TotalsHandle } from "components/check/CheckDisplay";
import { CheckSettings, CheckSettingsProps } from "components/check/CheckSettings";
import { CheckSummary, CheckSummaryProps } from "components/check/CheckSummary";
import { LinkIconButton, redirect } from "components/Link";
import { AccessType, AuthUser, BaseProps, Check, Contributor, Item, UserAdmin } from "declarations";
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
import { formatAccessLink, formatCurrency, interpolateString } from "services/formatter";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";
import { AuthType, useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckUsers = Required<Pick<Check, "editor" | "owner" | "viewer">>;

const USER_ACCESS: AccessType[] = ["owner", "editor", "viewer"];

const Page = styled(
  (
    props: InferGetServerSidePropsType<typeof getServerSideProps> & Pick<BaseProps, "className">
  ) => {
    const { loading, setLoading } = useLoading();
    const router = useRouter();
    const { setSnackbar } = useSnackbar();
    const currentUserInfo = useAuth() as Required<AuthType>; // Only authenticated users can enter
    const [users, setUsers] = useState<CheckUsers>({
      editor: props.data.editor || {},
      owner: props.data.owner || {},
      viewer: props.data.viewer || {},
    });
    const currentUserAccess = USER_ACCESS.reduce((prevAccessType, accessType, rank) => {
      if (users[accessType][currentUserInfo.uid]) {
        return rank;
      } else {
        return prevAccessType;
      }
    }, USER_ACCESS.length - 1); // Start at lowest access until verified
    // const currentUserAccess = 2;
    const [contributors, setContributors] = useState<Contributor[]>(props.data.contributors || []);
    const [items, setItems] = useState<Item[]>(props.data.items || []);
    const [title, setTitle] = useState(props.data.title);
    const [checkSettingsOpen, setCheckSettingsOpen] = useState(false);
    const [checkSummaryContributor, setCheckSummaryContributor] = useState(-1);
    const [checkSummaryOpen, setCheckSummaryOpen] = useState(false); // Use separate open state so data doesn't clear during dialog animation
    const [restricted, setRestricted] = useState(props.data.invite.required);
    const [inviteId, setInviteId] = useState(props.data.invite.id);
    const [inviteType, setInviteType] = useState<AccessType>(props.data.invite.type);
    const writeAccess = !restricted || currentUserAccess < 2;
    const [accessLink, setAccessLink] = useState(
      formatAccessLink(
        // Viewers may not view/share invite links
        !writeAccess ? false : props.data.invite.required,
        props.id,
        props.data.invite.id
      )
    );
    const locale = router.locale ?? router.defaultLocale!;
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
          title,
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
            const checkData = snapshot.data() as Check;
            if (typeof checkData !== "undefined") {
              if (checkData.title !== title) {
                setTitle(checkData.title);
              }
              // const target = totalsRef?.current?.getTarget();
              // TODO: Unset floating menu + peripheral (using consolidated version that will be exposed by CheckDisplay as an imperative handle)
              if (typeof checkData.items === "object" && Array.isArray(checkData.items)) {
                // checkData.items.forEach((item, itemIndex) => {
                //   if (typeof item.name !== "undefined") {
                //     const nameEl = document.getElementById(`name-${itemIndex}`) as HTMLInputElement;
                //     if (nameEl) {
                //       nameEl.value = item.name;
                //     }
                //   }
                //   if (typeof item.cost !== "undefined") {
                //     const costEl = document.getElementById(`cost-${itemIndex}`) as HTMLInputElement;
                //     if (costEl) {
                //       const itemCost = item.cost;
                //       costEl.dataset.value = itemCost.toString();
                //       costEl.value = formatCurrency(locale, itemCost);
                //     }
                //   }
                //   if (typeof item.buyer !== "undefined") {
                //     const buyerEl = document.getElementById(
                //       `buyer-${itemIndex}`
                //     ) as HTMLSelectElement;
                //     if (buyerEl) {
                //       buyerEl.value = item.buyer.toString();
                //     }
                //   }
                //   if (typeof item.split !== "undefined") {
                //     item.split.forEach((split, splitIndex) => {
                //       const splitEl = document.getElementById(
                //         `split-${itemIndex}-${splitIndex}`
                //       ) as HTMLInputElement;
                //       if (splitEl) {
                //         splitEl.value = split.toString();
                //       }
                //     });
                //   }
                // });
                setItems([...checkData.items]);
              }
              if (
                typeof checkData.contributors === "object" &&
                Array.isArray(checkData.contributors)
              ) {
                // checkData.contributors.forEach((contributor, contributorIndex) => {
                //   if (typeof contributor !== "undefined") {
                //     const contributorEl = document.getElementById(
                //       `contributor-${contributorIndex}`
                //     ) as HTMLInputElement;
                //     if (contributorEl) {
                //       contributorEl.value = contributor;
                //     }
                //   }
                // });
                setContributors([...checkData.contributors]);
              }
              if (
                typeof checkData.owner === "object" ||
                typeof checkData.editor === "object" ||
                typeof checkData.viewer === "object"
              ) {
                const newUsers = { ...users };
                if (typeof checkData.owner === "object") {
                  newUsers.owner = checkData.owner;
                }
                if (typeof checkData.editor === "object") {
                  newUsers.editor = checkData.editor;
                }
                if (typeof checkData.viewer === "object") {
                  newUsers.viewer = checkData.viewer;
                }
                setUsers(newUsers);
              }
              if (typeof checkData.invite === "object") {
                if (typeof checkData.invite.id === "string") {
                  setInviteId(checkData.invite.id);
                  setAccessLink(
                    formatAccessLink(
                      !writeAccess ? false : checkData.invite.required ?? restricted,
                      props.id,
                      checkData.invite.id
                    )
                  );
                }
                if (typeof checkData.invite.required === "boolean") {
                  setRestricted(checkData.invite.required);
                }
                if (typeof checkData.invite.type === "string") {
                  setInviteType(checkData.invite.type);
                }
              }
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
        const newContributors = contributors.concat({
          id: generateUid(),
          name: interpolateString(props.strings["contributorIndex"], {
            index: (contributors.length + 1).toString(),
          }),
        });
        const newItems = [...items];
        newItems.forEach((item) => {
          item.split?.push(0);
        });
        setItems(newItems);
        setContributors(newContributors);
        const checkDoc = doc(db, "checks", props.id);
        updateDoc(checkDoc, {
          contributors: newContributors,
          items: newItems,
          updatedAt: Date.now(),
        });
      };

      const handleAddItemClick = () => {
        const newItems = items.concat({
          buyer: 0,
          cost: 0,
          id: generateUid(),
          name: interpolateString(props.strings["itemIndex"], {
            index: (items.length + 1).toString(),
          }),
          split: contributors.map(() => 1),
        });
        setItems(newItems);
        const checkDoc = doc(db, "checks", props.id);
        updateDoc(checkDoc, {
          items: newItems,
          updatedAt: Date.now(),
        });
      };

      const handleBuyerChange: CheckDisplayProps["onBuyerChange"] = async (e, itemIndex) => {
        try {
          const value = e.target.selectedIndex;
          if (items[itemIndex].buyer !== value) {
            const newItems = [...items];
            newItems[itemIndex].buyer = value;
            setItems(newItems);
            const checkDoc = doc(db, "checks", props.id);
            updateDoc(checkDoc, {
              items: newItems,
              updatedAt: Date.now(),
            });
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleContributorBlur: CheckDisplayProps["onContributorBlur"] = async (
        e,
        contributorIndex
      ) => {
        try {
          const value = e.target.value;
          if (contributors[contributorIndex].name !== value) {
            const newContributors = [...contributors];
            newContributors[contributorIndex].name = value;
            setContributors(newContributors);
            const checkDoc = doc(db, "checks", props.id);
            updateDoc(checkDoc, {
              contributors: newContributors,
              updatedAt: Date.now(),
            });
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleContributorDelete: CheckDisplayProps["onContributorDelete"] = async (
        _e,
        contributorIndex
      ) => {
        try {
          const newContributors = contributors.filter(
            (_value, contributorFilterIndex) => contributorFilterIndex !== contributorIndex
          );
          const newItems = items.map((item) => {
            const newItem = { ...item };
            if (item.buyer === contributorIndex) {
              newItem.buyer = 0;
            }
            const newSplit = item.split?.filter(
              (_value, splitFilterIndex) => splitFilterIndex !== contributorIndex
            );
            newItem.split = newSplit;

            return newItem;
          });
          setContributors(newContributors);
          setItems(newItems);

          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            contributors: newContributors,
            items: newItems,
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

      const handleCostBlur: CheckDisplayProps["onCostBlur"] = async (e, itemIndex) => {
        try {
          const target = e.target;
          const value = Number(target.dataset.value);
          if (items[itemIndex].cost !== value) {
            const newItems = [...items];
            newItems[itemIndex].cost = value;
            setItems(newItems);
            const checkDoc = doc(db, "checks", props.id);
            updateDoc(checkDoc, {
              items: newItems,
              updatedAt: Date.now(),
            });
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleDeleteCheckClick: CheckSettingsProps["onDeleteCheckClick"] = async (newUsers) => {
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
          setUsers(newUsers);
          const batch = writeBatch(db);
          const checkDoc = doc(db, "checks", props.id);
          batch.update(doc(db, "users", currentUserInfo.uid), {
            checks: arrayRemove(checkDoc),
          });
          batch.update(checkDoc, {
            ...newUsers,
            updatedAt: Date.now(),
          });
          await batch.commit();
          redirect(setLoading, "/");
        }
      };

      const handleInviteTypeChange: CheckSettingsProps["onInviteTypeChange"] = async (
        inviteType
      ) => {
        setInviteType(inviteType);
        const checkDoc = doc(db, "checks", props.id);
        // Don't await update, allow user interaction immediately
        updateDoc(checkDoc, {
          "invite.type": inviteType,
          updatedAt: Date.now(),
        });
      };

      const handleItemDelete: CheckDisplayProps["onItemDelete"] = async (_e, itemIndex) => {
        try {
          const newItems = items.filter((_value, filterIndex) => filterIndex !== itemIndex);

          setItems(newItems);
          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            items: newItems,
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

      const handleNameBlur: CheckDisplayProps["onNameBlur"] = async (e, itemIndex) => {
        try {
          const value = e.target.value;
          if (items[itemIndex].name !== value) {
            const newItems = [...items];
            newItems[itemIndex].name = value;
            setItems(newItems);
            const checkDoc = doc(db, "checks", props.id);
            updateDoc(checkDoc, {
              items: newItems,
              updatedAt: Date.now(),
            });
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      const handleRegenerateInviteLinkClick: CheckSettingsProps["onRegenerateInviteLinkClick"] =
        () => {
          const newInviteId = generateUid();
          setInviteId(newInviteId);
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
            updatedAt: Date.now(),
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
        setRestricted(newRestricted);
        setAccessLink(formatAccessLink(!writeAccess ? false : newRestricted, props.id, inviteId));
        const checkDoc = doc(db, "checks", props.id);
        updateDoc(checkDoc, {
          "invite.required": newRestricted,
          updatedAt: Date.now(),
        });
      };

      const handleSplitBlur: CheckDisplayProps["onSplitBlur"] = async (
        e,
        itemIndex,
        splitIndex
      ) => {
        try {
          const target = e.target;
          const value = Number(target.value);
          if (items[itemIndex].split?.[splitIndex] !== value) {
            const newItems = [...items];
            const itemSplit = newItems[itemIndex].split;
            if (typeof itemSplit !== "undefined") {
              itemSplit[splitIndex] = value;
            }
            setItems(newItems);
            const checkDoc = doc(db, "checks", props.id);
            updateDoc(checkDoc, {
              items: newItems,
              updatedAt: Date.now(),
            });
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      handleTitleBlur = async (e) => {
        try {
          const checkDoc = doc(db, "checks", props.id);
          updateDoc(checkDoc, {
            title,
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
        setTitle(e.target.value);
      };

      const handleUserAccessChange: CheckSettingsProps["onUserAccessChange"] = async (newUsers) => {
        setUsers(newUsers);
        const checkDoc = doc(db, "checks", props.id);
        updateDoc(checkDoc, {
          ...newUsers,
          updatedAt: Date.now(),
        });
        // Opt to shallow copy objects in JS for reusability when setting state as opposed to the following code
        // updateDoc(checkDoc, {
        //   [`${currentAccess}.${currentUid}`]: deleteField(),
        //   [`${newAccess}.${currentUid}`]: currentUserData,
        // });
      };

      renderMain = (
        <>
          <CheckDisplay
            className="Body-root"
            contributors={contributors}
            items={items}
            loading={loading.active}
            onBuyerChange={handleBuyerChange}
            onContributorBlur={handleContributorBlur}
            onContributorDelete={handleContributorDelete}
            onContributorSummaryClick={handleContributorSummaryClick}
            onCostBlur={handleCostBlur}
            onItemDelete={handleItemDelete}
            onNameBlur={handleNameBlur}
            onSplitBlur={handleSplitBlur}
            ref={totalsRef}
            strings={props.strings}
            userAccess={currentUserAccess}
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
            inviteId={inviteId}
            inviteType={inviteType}
            onClose={handleSettingsDialogClose}
            onDeleteCheckClick={handleDeleteCheckClick}
            onInviteTypeChange={handleInviteTypeChange}
            onRegenerateInviteLinkClick={handleRegenerateInviteLinkClick}
            onRemoveUserClick={handleRemoveUserClick}
            onRestrictionChange={handleRestrictionChange}
            onShareClick={handleShareClick}
            onUserAccessChange={handleUserAccessChange}
            open={checkSettingsOpen}
            restricted={restricted}
            strings={props.strings}
            userAccess={currentUserAccess}
            users={users}
            writeAccess={writeAccess}
          />
        </>
      );
    } else {
      renderMain = (
        <>
          <CheckDisplay
            className="Body-root"
            contributors={contributors}
            items={items}
            loading={loading.active}
            onContributorSummaryClick={handleContributorSummaryClick}
            ref={totalsRef}
            strings={props.strings}
            userAccess={currentUserAccess}
            writeAccess={writeAccess}
          />
          <ActionButton Icon={Share} label={props.strings["share"]} onClick={handleShareClick} />
          <CheckSettings
            accessLink={accessLink}
            inviteId={inviteId}
            inviteType={inviteType}
            onClose={handleSettingsDialogClose}
            onShareClick={handleShareClick}
            open={checkSettingsOpen}
            restricted={restricted}
            strings={props.strings}
            userAccess={currentUserAccess}
            users={users}
            writeAccess={writeAccess}
          />
        </>
      );
    }
    return (
      <div
        className={props.className}
        onClick={(e) => {
          // setTimeout(() => {
          //   console.log(e.target, totalsRef.current);
          // }, 500);
        }}
      >
        <Head>
          <title>{title}</title>
        </Head>
        <header className="Header-root">
          <LinkIconButton className="Header-back" NextLinkProps={{ href: "/" }}>
            <ArrowBack />
          </LinkIconButton>
          <TextField
            className="Header-title"
            disabled={loading.active || !writeAccess}
            onBlur={handleTitleBlur}
            onChange={handleTitleChange}
            size="small"
            value={title}
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
          contributors={contributors}
          currentContributor={checkSummaryContributor}
          items={items}
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
            !checkData.editor?.[authUser.uid] &&
            !checkData.viewer?.[authUser.uid]
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
