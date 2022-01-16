import { ArrowBack, PersonAdd, Settings, Share } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { ActionButton } from "components/check/ActionButton";
import { CheckDisplay, CheckDisplayProps } from "components/check/CheckDisplay";
import { CheckSettings, CheckSettingsProps } from "components/check/CheckSettings";
import { LinkIconButton, redirect } from "components/Link";
import { ValidateForm, ValidateTextField } from "components/ValidateForm";
import { AccessType, BaseProps, Check, Contributor, Item } from "declarations";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";
import localeSubset from "locales/check.json";
import { InferGetServerSidePropsType } from "next";
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
import { UnauthorizedError } from "services/error";
import { db, generateUid } from "services/firebase";
import { dbAdmin } from "services/firebaseAdmin";
import { formatAccessLink, formatCurrency, interpolateString } from "services/formatter";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckUsers = Required<Pick<Check, "editor" | "owner" | "viewer">>;

const Page = styled(
  (
    props: InferGetServerSidePropsType<typeof getServerSideProps> & Pick<BaseProps, "className">
  ) => {
    const { loading, setLoading } = useLoading();
    const router = useRouter();
    const { setSnackbar } = useSnackbar();
    const [contributors, setContributors] = useState<Contributor[]>(props.check.contributors || []);
    const [items, setItems] = useState<Item[]>(props.check.items);
    const [name, setName] = useState(props.check.name);
    const [checkSettingsOpen, setCheckSettingsOpen] = useState(false);
    const [restricted, setRestricted] = useState(props.check.invite.required);
    const [inviteId, setInviteId] = useState(props.check.invite.id);
    const [inviteType, setInviteType] = useState<AccessType>(props.check.invite.type);
    const [accessLink, setAccessLink] = useState(
      formatAccessLink(props.check.invite.required, props.check.id, props.check.invite.id)
    );
    const [users, setUsers] = useState<CheckUsers>({
      editor: props.check.editor || {},
      owner: props.check.owner || {},
      viewer: props.check.viewer || {},
    });
    const locale = router.locale ?? router.defaultLocale!;
    const unsubscribe = useRef(() => {});

    const handleAddContributorClick = async () => {
      const newContributors = contributors.concat(
        interpolateString(props.strings["contributorIndex"], {
          index: (contributors.length + 1).toString(),
        })
      );
      const newItems = [...items];
      newItems.forEach((item) => {
        item.split?.push(0);
      });
      setItems(newItems);
      setContributors(newContributors);
      const checkDoc = doc(db, "checks", props.check.id);
      updateDoc(checkDoc, {
        contributors: newContributors,
        items: newItems,
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
      const checkDoc = doc(db, "checks", props.check.id);
      updateDoc(checkDoc, {
        items: newItems,
      });
    };

    const handleBuyerChange: CheckDisplayProps["onBuyerChange"] = async (e, itemIndex) => {
      try {
        const value = e.target.selectedIndex;
        if (items[itemIndex].buyer !== value) {
          const newItems = [...items];
          newItems[itemIndex].buyer = value;
          setItems(newItems);
          const checkDoc = doc(db, "checks", props.check.id);
          updateDoc(checkDoc, {
            items: newItems,
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
        if (contributors[contributorIndex] !== value) {
          const newContributors = [...contributors];
          newContributors[contributorIndex] = value;
          setContributors(newContributors);
          const checkDoc = doc(db, "checks", props.check.id);
          updateDoc(checkDoc, {
            contributors: newContributors,
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

        const checkDoc = doc(db, "checks", props.check.id);
        updateDoc(checkDoc, {
          contributors: newContributors,
          items: newItems,
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
          const checkDoc = doc(db, "checks", props.check.id);
          updateDoc(checkDoc, {
            items: newItems,
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

    const handleItemDelete: CheckDisplayProps["onItemDelete"] = async (_e, itemIndex) => {
      try {
        const newItems = items.filter((_value, filterIndex) => filterIndex !== itemIndex);

        setItems(newItems);
        const checkDoc = doc(db, "checks", props.check.id);
        updateDoc(checkDoc, {
          items: newItems,
        });
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    };

    const handleItemNameBlur: CheckDisplayProps["onItemNameBlur"] = async (e, itemIndex) => {
      try {
        const value = e.target.value;
        if (items[itemIndex].name !== value) {
          const newItems = [...items];
          newItems[itemIndex].name = value;
          setItems(newItems);
          const checkDoc = doc(db, "checks", props.check.id);
          updateDoc(checkDoc, {
            items: newItems,
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

    const handleNameBlur: FocusEventHandler<HTMLInputElement> = async (e) => {
      try {
        const checkDoc = doc(db, "checks", props.check.id);
        updateDoc(checkDoc, {
          name,
        });
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    };

    const handleNameChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      setName(e.target.value);
    };

    const handleRegenerateInviteLinkClick: CheckSettingsProps["onRegenerateInviteLinkClick"] =
      () => {
        const newInviteId = generateUid();
        setInviteId(newInviteId);
        setAccessLink(formatAccessLink(true, props.check.id, newInviteId));
        setSnackbar({
          active: true,
          autoHideDuration: 3500,
          message: props.strings["inviteLinkRegenerated"],
          type: "success",
        });
        return newInviteId;
      };

    const handleRestrictionChange: CheckSettingsProps["onRestrictionChange"] = (newRestricted) => {
      if (newRestricted !== null) {
        setRestricted(newRestricted);
        setAccessLink(formatAccessLink(newRestricted, props.check.id, inviteId));
      }
    };

    const handleSettingsDialogClose: CheckSettingsProps["onClose"] = (_e, _reason) => {
      setCheckSettingsOpen(false);
    };

    const handleSettingsDialogOpen: MouseEventHandler<HTMLButtonElement> = (_e) => {
      setCheckSettingsOpen(true);
    };

    const handleShareClick = async () => {
      try {
        await navigator.share({
          title: name,
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

    const handleSplitBlur: CheckDisplayProps["onSplitBlur"] = async (e, itemIndex, splitIndex) => {
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
          const checkDoc = doc(db, "checks", props.check.id);
          updateDoc(checkDoc, {
            items: newItems,
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

    useEffect(() => {
      unsubscribe.current = onSnapshot(
        doc(db, "checks", props.check.id),
        (snapshot) => {
          if (!snapshot.metadata.hasPendingWrites) {
            const checkData = snapshot.data() as Check;
            if (typeof checkData !== "undefined") {
              if (checkData.name !== name) {
                setName(checkData.name);
              }
              if (typeof checkData.items === "object" && Array.isArray(checkData.items)) {
                checkData.items.forEach((item) => {
                  if (typeof item.name !== "undefined") {
                    const nameEl = document.getElementById(`name-${item.id}`) as HTMLInputElement;
                    if (nameEl) {
                      nameEl.value = item.name;
                    }
                  }
                  if (typeof item.cost !== "undefined") {
                    const costEl = document.getElementById(`cost-${item.id}`) as HTMLInputElement;
                    if (costEl) {
                      const itemCost = item.cost;
                      costEl.dataset.value = itemCost.toString();
                      costEl.value = formatCurrency(locale, itemCost);
                    }
                  }
                  if (typeof item.buyer !== "undefined") {
                    const buyerEl = document.getElementById(
                      `buyer-${item.id}`
                    ) as HTMLSelectElement;
                    if (buyerEl) {
                      buyerEl.value = item.buyer.toString();
                    }
                  }
                  if (typeof item.split !== "undefined") {
                    item.split.forEach((split, splitIndex) => {
                      const splitEl = document.getElementById(
                        `split-${item.id}-${splitIndex}`
                      ) as HTMLInputElement;
                      if (splitEl) {
                        splitEl.value = split.toString();
                      }
                    });
                  }
                });
                setItems([...checkData.items]);
              }
              if (
                typeof checkData.contributors === "object" &&
                Array.isArray(checkData.contributors)
              ) {
                checkData.contributors.forEach((contributor, contributorIndex) => {
                  if (typeof contributor !== "undefined") {
                    const contributorEl = document.getElementById(
                      `contributor-${contributorIndex}`
                    ) as HTMLInputElement;
                    if (contributorEl) {
                      contributorEl.value = contributor;
                    }
                  }
                });
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
                      checkData.invite.required ?? restricted,
                      props.check.id,
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

    return (
      <ValidateForm className={props.className}>
        <header className="Header-root">
          <LinkIconButton className="Header-back" NextLinkProps={{ href: "/" }}>
            <ArrowBack />
          </LinkIconButton>
          <ValidateTextField
            className="Header-title"
            label={props.strings["name"]}
            onBlur={handleNameBlur}
            onChange={handleNameChange}
            size="small"
            value={name}
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
        <main className="Body-root">
          <CheckDisplay
            contributors={contributors}
            items={items}
            loading={loading.active}
            onBuyerChange={handleBuyerChange}
            onContributorBlur={handleContributorBlur}
            onContributorDelete={handleContributorDelete}
            onCostBlur={handleCostBlur}
            onItemDelete={handleItemDelete}
            onItemNameBlur={handleItemNameBlur}
            onSplitBlur={handleSplitBlur}
            strings={props.strings}
          />
        </main>
        <ActionButton
          label={props.strings["addItem"]}
          onClick={handleAddItemClick}
          subActions={[
            {
              Icon: PersonAdd,
              name: props.strings["addContributor"],
              onClick: handleAddContributorClick,
            },
            {
              Icon: Share,
              name: props.strings["share"],
              onClick: handleShareClick,
            },
          ]}
        />
        <CheckSettings
          accessLink={accessLink}
          check={props.check}
          checkName={name}
          inviteId={inviteId}
          inviteType={inviteType}
          onClose={handleSettingsDialogClose}
          onRegenerateInviteLinkClick={handleRegenerateInviteLinkClick}
          onRestrictionChange={handleRestrictionChange}
          open={checkSettingsOpen}
          restricted={restricted}
          setInviteType={setInviteType}
          setUsers={setUsers}
          strings={props.strings}
          unsubscribe={unsubscribe.current}
          users={users}
        />
      </ValidateForm>
    );
  }
)`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;

    & .Body-root {
      flex: 1;
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
      margin-left: ${theme.spacing(2)};
    }
  `}
`;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  if (context.locale) {
    const strings = getLocaleStrings(context.locale, localeSubset);
    const data = await dbAdmin.runTransaction(async (transaction) => {
      const authUser = await getAuthUser(context);
      if (authUser !== null) {
        const checkRef = dbAdmin.collection("checks").doc(context.query.checkId as string);
        const check = await transaction.get(checkRef);
        const checkData = check.data();
        if (typeof checkData !== "undefined") {
          const restricted = checkData.invite.required;

          if (restricted === true) {
            if (context.query.inviteId === checkData.invite.id) {
              if (checkData.invite.type === "editor" && !checkData.owner[authUser.uid]) {
                // Add user as editor if not an owner
                const editor = {
                  ...checkData.editor,
                  [authUser.uid]: {
                    displayName: authUser.displayName,
                    email: authUser.email,
                    photoURL: authUser.photoURL,
                  },
                }; // Use spread to force into object if undefined
                // Promote viewers to editor if using an editor invite
                const viewer = { ...checkData.viewer };
                delete viewer[authUser.uid];
                await transaction.set(
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
                  [authUser.uid]: {
                    displayName: authUser.displayName,
                    email: authUser.email,
                    photoURL: authUser.photoURL,
                  },
                };
                await transaction.set(
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
            // If invited or authorized, then add check to user document
            transaction.set(
              dbAdmin.collection("users").doc(authUser.uid),
              {
                checks: FieldValue.arrayUnion(checkRef),
              },
              { merge: true }
            );
          }
          return {
            auth: authUser,
            check: {
              ...checkData,
              id: context.query.checkId,
              modifiedAt: check.updateTime?.toMillis(),
            },
          };
        }
      } else {
        throw new UnauthorizedError();
      }
    });
    return {
      props: { ...data, strings },
    };
  }
  throw new UnauthorizedError();
});

export default Page;
