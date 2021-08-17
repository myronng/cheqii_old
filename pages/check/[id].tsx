import { styled } from "@material-ui/core/styles";
import { ArrowBack, PersonAdd, Share } from "@material-ui/icons";
import { Account } from "components/Account";
import { ActionButton } from "components/check/ActionButton";
import { CheckDisplay, CheckDisplayProps } from "components/check/CheckDisplay";
import { LinkIconButton } from "components/Link";
import { ValidateForm, ValidateTextField } from "components/ValidateForm";
import { Check, Contributor, Item, StyledProps } from "declarations";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { InferGetServerSidePropsType } from "next";
import { ChangeEventHandler, FocusEventHandler, useEffect, useState } from "react";
import { verifyAuthToken } from "services/authenticator";
import { UnauthorizedError } from "services/error";
import { db } from "services/firebase";
import { dbAdmin } from "services/firebaseAdmin";
import { useCurrencyFormat } from "services/formatter";
import { withContextErrorHandler } from "services/middleware";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

const Page = styled(
  (props: InferGetServerSidePropsType<typeof getServerSideProps> & StyledProps) => {
    const userInfo = useAuth();
    const { loading, setLoading } = useLoading();
    const { setSnackbar } = useSnackbar();
    const [contributors, setContributors] = useState<Contributor[]>(props.check.contributors);
    const [localContributors, setLocalContributors] = useState<Contributor[]>([]);
    const [items, setItems] = useState<Item[]>(props.check.items);
    const [localItems, setLocalItems] = useState<Item[]>([]);
    const [name, setName] = useState(props.check.name);
    const formatCurrency = useCurrencyFormat();
    let unsubscribe: undefined | (() => void);

    const handleActionButtonClick = () => {
      const newItems = localItems.concat({
        buyer: 0,
        cost: 0,
        id: doc(collection(db, "checks")).id,
        name: "",
        split: contributors.map(() => 1),
      });
      setLocalItems(newItems);
    };

    const handleBuyerChange: CheckDisplayProps["onBuyerChange"] = async (e, type, itemIndex) => {
      try {
        let newItems;
        const value = e.target.selectedIndex;
        if (type === "new" && localItems[itemIndex].buyer !== value) {
          const extractedItem = localItems.splice(itemIndex, 1);
          extractedItem[0].buyer = value;
          newItems = items.concat(extractedItem);
          setLocalItems(localItems);
        } else if (type === "existing" && items[itemIndex].buyer !== value) {
          newItems = items.slice();
          newItems[itemIndex].buyer = value;
        }
        if (typeof newItems !== "undefined") {
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
      type,
      contributorIndex
    ) => {
      try {
        const target = e.target;
        const value = target.value;
        if (target.checkValidity()) {
          let newContributors;
          if (type === "new" && localContributors[contributorIndex] !== value) {
            const extractedContributor = localContributors.splice(contributorIndex, 1);
            extractedContributor[0] = value;
            newContributors = contributors.concat(extractedContributor);
            setLocalContributors([...localContributors]);
          } else if (type === "existing" && contributors[contributorIndex] !== value) {
            newContributors = contributors.slice();
            newContributors[contributorIndex] = value;
          }
          if (typeof newContributors !== "undefined") {
            console.log(newContributors);
            setContributors(newContributors);
            const checkDoc = doc(db, "checks", props.check.id);
            await updateDoc(checkDoc, {
              contributors: newContributors,
            });
          }
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    };

    const handleCostBlur: CheckDisplayProps["onCostBlur"] = async (e, type, itemIndex) => {
      try {
        const target = e.target;
        if (target.checkValidity()) {
          const value = Number(target.dataset.value);
          let newItems;
          if (type === "new" && localItems[itemIndex].cost !== value) {
            const extractedItem = localItems.splice(itemIndex, 1);
            extractedItem[0].cost = value;
            newItems = items.concat(extractedItem);
            setLocalItems([...localItems]);
          } else if (type === "existing" && items[itemIndex].cost !== value) {
            newItems = items.slice();
            newItems[itemIndex].cost = value;
          }
          if (typeof newItems !== "undefined") {
            setItems(newItems);
            const checkDoc = doc(db, "checks", props.check.id);
            updateDoc(checkDoc, {
              items: newItems,
            });
          }
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    };

    const handleItemNameBlur: CheckDisplayProps["onItemNameBlur"] = async (e, type, itemIndex) => {
      try {
        const target = e.target;
        if (target.checkValidity()) {
          const value = target.value;
          let newItems;
          if (type === "new" && localItems[itemIndex].name !== value) {
            const extractedItem = localItems.splice(itemIndex, 1);
            extractedItem[0].name = value;
            newItems = items.concat(extractedItem);
            setLocalItems([...localItems]);
          } else if (type === "existing" && items[itemIndex].name !== value) {
            newItems = items.slice();
            newItems[itemIndex].name = value;
          }
          if (typeof newItems !== "undefined") {
            setItems(newItems);
            const checkDoc = doc(db, "checks", props.check.id);
            updateDoc(checkDoc, {
              items: newItems,
            });
          }
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
        if (e.target.checkValidity() && name !== props.check.name) {
          const checkDoc = doc(db, "checks", props.check.id);
          await updateDoc(checkDoc, {
            name,
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

    const handleNameChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      setName(e.target.value);
    };

    const handleSplitBlur: CheckDisplayProps["onSplitBlur"] = async (
      e,
      type,
      itemIndex,
      splitIndex
    ) => {
      try {
        const target = e.target;
        if (target.checkValidity()) {
          const value = Number(target.value);
          let newItems;
          if (type === "new" && localItems[itemIndex].split?.[splitIndex] !== value) {
            const extractedItem = localItems.splice(itemIndex, 1);
            const itemSplit = extractedItem[0].split;
            if (typeof itemSplit !== "undefined") {
              itemSplit[splitIndex] = value;
              newItems = items.concat(extractedItem);
              setLocalItems([...localItems]);
            }
          } else if (type === "existing" && items[itemIndex].split?.[splitIndex] !== value) {
            newItems = items.slice();
            const itemSplit = newItems[itemIndex].split;
            if (typeof itemSplit !== "undefined") {
              itemSplit[splitIndex] = value;
            }
          }
          if (typeof newItems !== "undefined") {
            setItems(newItems);
            const checkDoc = doc(db, "checks", props.check.id);
            updateDoc(checkDoc, {
              items: newItems,
            });
          }
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
      unsubscribe = onSnapshot(doc(db, "checks", props.check.id), (snapshot) => {
        if (!snapshot.metadata.hasPendingWrites) {
          const checkData = snapshot.data() as Check;
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
                  costEl.value = formatCurrency(itemCost.toString());
                }
              }
              if (typeof item.buyer !== "undefined") {
                const buyerEl = document.getElementById(`buyer-${item.id}`) as HTMLSelectElement;
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
          if (typeof checkData.contributors === "object" && Array.isArray(checkData.contributors)) {
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
        }
      });

      return () => {
        unsubscribe!();
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
            label="Name"
            onBlur={handleNameBlur}
            onChange={handleNameChange}
            size="small"
            value={name}
          />
          <Account onSignOut={unsubscribe} />
        </header>
        <main className="Body-root">
          <CheckDisplay
            contributors={contributors}
            items={items}
            localContributors={localContributors}
            localItems={localItems}
            onBuyerChange={handleBuyerChange}
            onContributorBlur={handleContributorBlur}
            onCostBlur={handleCostBlur}
            onItemNameBlur={handleItemNameBlur}
            onSplitBlur={handleSplitBlur}
          />
        </main>
        <ActionButton
          checkId={props.check.id}
          label="Add Item"
          onClick={handleActionButtonClick}
          subActions={[
            {
              Icon: PersonAdd,
              name: "Add Contributor",
              onClick: () => {},
            },
            {
              Icon: Share,
              name: "Share",
              onClick: () => {},
            },
          ]}
        />
      </ValidateForm>
    );
  }
)`
  ${({ theme }) => `
    & .Body-root{
      overflow: auto;
    }

    & .Header-root {
      display: flex;
      margin: ${theme.spacing(2)};

      & .Header-title {
        margin-left: ${theme.spacing(2)};

        & .MuiInputLabel-root {
          margin-left: ${theme.spacing(1)};
        }

        & .MuiOutlinedInput-input {
          margin: ${theme.spacing(0, 1)};
        }

        & .MuiOutlinedInput-notchedOutline legend {
          margin-left: ${theme.spacing(1)};
        }
      }
    }
  `}
`;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  if (context.req.cookies.authToken) {
    const decodedToken = await verifyAuthToken(context);
    if (decodedToken !== null) {
      const checkData: Check = (
        await dbAdmin
          .collection("checks")
          .doc(context.query.id as string)
          .get()
      ).data()!;
      if (
        checkData &&
        (checkData.owners?.[decodedToken.uid] ||
          checkData.editors?.[decodedToken.uid] ||
          checkData.viewers?.[decodedToken.uid])
      ) {
        return {
          props: {
            auth: decodedToken,
            check: { ...checkData, id: context.query.id },
          },
        };
      }
    }
  }
  throw new UnauthorizedError();
});

export default Page;
