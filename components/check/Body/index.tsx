import {
  AddCircleOutline,
  PersonAddAlt1Outlined,
  PersonRemoveAlt1Outlined,
  RemoveCircleOutline,
  Share,
} from "@mui/icons-material";
import { Button, IconButton } from "@mui/material";
import { darken, lighten, styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { ShareClickHandler } from "components/check";
import { BuyerSelect } from "components/check/Body/Inputs/BuyerSelect";
import { ContributorInput } from "components/check/Body/Inputs/ContributorInput";
import { CostInput } from "components/check/Body/Inputs/CostInput";
import { NameInput } from "components/check/Body/Inputs/NameInput";
import { SplitInput } from "components/check/Body/Inputs/SplitInput";
import { Summary, SummaryProps } from "components/check/Body/Summary";
import { SummaryButton, SummaryButtonProps } from "components/check/Body/Summary/SummaryButton";
import { CopyButton } from "components/CopyButton";
import { Hint } from "components/Hint";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, CheckDataForm, CheckUsers } from "declarations";
import { add, allocate, Dinero, dinero, subtract } from "dinero.js";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import {
  Dispatch,
  FocusEventHandler,
  Fragment,
  SetStateAction,
  UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { db, getUniqueId } from "services/firebase";
import { formatCurrency, formatInteger, interpolateString } from "services/formatter";
import { getCurrencyType, getLocale } from "services/locale";
import {
  parseCurrencyAmount,
  parseDineroAmount,
  parseDineroMap,
  parseRatioAmount,
} from "services/parser";
import { comfortaa, firaCode } from "services/theme";
import { checkDataToCheck, itemStateToItem } from "services/transformer";

export type NumericBalance = {
  amount: number;
  contributor: number;
}[];

export type BodyProps = Pick<BaseProps, "className" | "strings"> & {
  accessLink: string;
  checkData: CheckDataForm;
  checkId: string;
  checkUsers: CheckUsers;
  hash: string;
  onScroll: (e: UIEvent<HTMLElement>) => void;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  title: string;
  writeAccess: boolean;
};

export type ItemPaymentMap = Map<number, PaymentMap>;

export type PaymentMap = Map<number, Dinero<number>>;

export const Body = styled(
  ({
    accessLink,
    className,
    checkData,
    checkId,
    checkUsers,
    hash,
    onScroll,
    setCheckData,
    strings,
    title,
    writeAccess,
  }: BodyProps) => {
    const router = useRouter();
    const locale = getLocale(router);
    const currency = getCurrencyType(locale);
    const { loading } = useLoading();
    const { setSnackbar } = useSnackbar();
    const { userInfo } = useAuth();
    const [selection, setSelection] = useState<{
      columnEnd: number;
      columnStart: number;
      rowEnd: number;
      rowStart: number;
    } | null>(null);
    const [summaryContributor, setSummaryContributor] = useState(-1);
    const [scrollElement, setScrollElement] = useState<string | null>(null);
    const [actionsOffset, setActionsOffset] = useState(0);
    const mainRef = useRef<HTMLElement>(null);

    const handleAddContributorClick = useCallback(async () => {
      try {
        if (writeAccess) {
          setCheckData((stateCheckData) => {
            // Must shallow copy contributors for memo dependencies that rely on checkData.contributors explicitly
            const newContributors = [...stateCheckData.contributors];
            const newItems = [...stateCheckData.items];
            newContributors.push({
              id: getUniqueId(),
              name: interpolateString(strings["contributorIndex"], {
                index: (stateCheckData.contributors.length + 1).toString(),
              }),
            });
            newItems.forEach((item) => {
              item.split.push(formatInteger(locale, 0));
            });

            const checkDoc = doc(db, "checks", checkId);
            const newStateCheckData = { items: newItems, contributors: newContributors };
            const docCheckData = checkDataToCheck(newStateCheckData, locale, currency);
            updateDoc(checkDoc, {
              ...docCheckData,
              updatedAt: Date.now(),
            });

            // Account for first 3 non-contributor columns
            setScrollElement(`[data-column='${newContributors.length + 2}'][data-row='0']`);

            return newStateCheckData;
          });
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    }, [checkId, currency, locale, setCheckData, setSnackbar, strings, writeAccess]);

    const handleAddItemClick = useCallback(async () => {
      try {
        if (writeAccess) {
          setCheckData((stateCheckData) => {
            const newItems = [...stateCheckData.items];
            newItems.push({
              buyer: 0,
              cost: formatCurrency(locale, 0),
              id: getUniqueId(),
              name: interpolateString(strings["itemIndex"], {
                index: (stateCheckData.items.length + 1).toString(),
              }),
              split: stateCheckData.contributors.map(() => formatInteger(locale, 1)),
            });

            const checkDoc = doc(db, "checks", checkId);
            updateDoc(checkDoc, {
              items: itemStateToItem(newItems, locale, currency),
              updatedAt: Date.now(),
            });

            setScrollElement(`[data-column='0'][data-row='${newItems.length}']`);

            return { ...stateCheckData, items: newItems };
          });
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    }, [checkId, currency, locale, setCheckData, setSnackbar, strings, writeAccess]);

    let deleteItemsAmount = 0,
      deleteContributorsAmount = 0;

    if (selection) {
      // Account for contributor row
      if (selection.rowEnd > 0) {
        deleteItemsAmount =
          selection.rowEnd - selection.rowStart + (selection.rowStart <= 0 ? 0 : 1);
      }
      // Account for item name, cost, and buyer columns
      if (selection.columnEnd > 2) {
        deleteContributorsAmount =
          selection.columnEnd - selection.columnStart + (selection.columnStart <= 2 ? 0 : 1);
      }
    }

    const handleDeleteContributorsClick = useCallback(async () => {
      try {
        // Check for writeAccess to handle access being changed after initial render
        if (writeAccess && selection) {
          // Clear summaryContributor if deleted to prevent null rendering issues
          const contributorStart = selection.columnStart - 3;
          const contributorEnd = selection.columnEnd - 3;
          if (summaryContributor >= contributorStart && summaryContributor <= contributorEnd) {
            setSummaryContributor(-1);
          }
          setCheckData((stateCheckData) => {
            const newContributors = stateCheckData.contributors.filter(
              (_value, contributorFilterIndex) =>
                contributorFilterIndex < contributorStart || contributorFilterIndex > contributorEnd
            );
            const newItems = stateCheckData.items.map((item) => {
              const newItem = { ...item };
              if (item.buyer >= contributorStart && item.buyer <= contributorEnd) {
                newItem.buyer = 0;
              }
              const newSplit = item.split.filter(
                (_value, splitFilterIndex) =>
                  splitFilterIndex < contributorStart || splitFilterIndex > contributorEnd
              );
              newItem.split = newSplit;
              return newItem;
            });
            const checkDoc = doc(db, "checks", checkId);
            const newStateCheckData = { items: newItems, contributors: newContributors };
            const docCheckData = checkDataToCheck(newStateCheckData, locale, currency);
            updateDoc(checkDoc, {
              ...docCheckData,
              updatedAt: Date.now(),
            });
            return newStateCheckData;
          });
          setSelection(null);
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    }, [
      checkId,
      currency,
      locale,
      selection,
      setCheckData,
      setSnackbar,
      summaryContributor,
      writeAccess,
    ]);

    const handleDeleteItemsClick = useCallback(async () => {
      try {
        if (writeAccess && selection) {
          const itemStart = selection.rowStart - 1;
          const itemEnd = selection.rowEnd - 1;
          setCheckData((stateCheckData) => {
            const newItems = stateCheckData.items.filter(
              (_value, filterIndex) => filterIndex < itemStart || filterIndex > itemEnd
            );
            const checkDoc = doc(db, "checks", checkId);
            updateDoc(checkDoc, {
              items: itemStateToItem(newItems, locale, currency),
              updatedAt: Date.now(),
            });
            return { ...stateCheckData, items: newItems };
          });
          setSelection(null);
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    }, [checkId, currency, locale, selection, setCheckData, setSnackbar, writeAccess]);

    const handleGridBlur: FocusEventHandler<HTMLFormElement> = (e) => {
      if (writeAccess) {
        const newFocusedTarget = e.relatedTarget as HTMLElement | null;
        if (newFocusedTarget) {
          const column = Number(newFocusedTarget.dataset?.column);
          const row = Number(newFocusedTarget.dataset?.row);
          if (Number.isNaN(column) || Number.isNaN(row)) {
            setSelection(null);
          }
        } else {
          setSelection(null);
        }
      }
    };

    const handleGridFocus: FocusEventHandler<HTMLFormElement> = (e) => {
      if (writeAccess) {
        const column = Number(e.target.dataset.column);
        const row = Number(e.target.dataset.row);
        if (!Number.isNaN(column) && !Number.isNaN(row)) {
          if (column > -1 && row > -1) {
            setSelection({
              columnEnd: column,
              columnStart: column,
              rowEnd: row,
              rowStart: row,
            });
          }
        } else {
          setSelection(null);
        }
      }
    };

    const handleSummaryClick: SummaryButtonProps["onClick"] = useCallback(
      (_e, contributorIndex) => {
        setSummaryContributor(contributorIndex);
      },
      []
    );

    const handleSummaryDialogClose: SummaryProps["onClose"] = useCallback(() => {
      window.location.hash = "#";
    }, []);

    // Buyer dropdown options
    const renderBuyerOptions = useMemo(
      () =>
        checkData.contributors.map((contributor, contributorIndex) => (
          <option key={contributor.id} value={contributorIndex}>
            {contributor.name}
          </option>
        )),
      [checkData.contributors]
    );

    // Item rows
    const [renderItems, itemOwing, totalOwing, totalPaid, totalCost] = useMemo(() => {
      let positiveSplitItemIndex = 0;
      let totalCost = dinero({ amount: 0, currency });
      const itemOwing: ItemPaymentMap = new Map();
      const totalPaid: PaymentMap = new Map();
      const totalOwing: PaymentMap = new Map();
      return [
        checkData.items.map((item, itemIndex) => {
          const itemId = item.id;
          const row = itemIndex + 1;
          const rowClass = row % 2 === 0 ? "Grid-alternate" : "";

          const splitNumeric: number[] = [];
          let hasPositiveSplit = false;

          const renderSplit = item.split.map((split, splitIndex) => {
            const currentSplit = parseRatioAmount(locale, split);
            if (currentSplit > 0) {
              hasPositiveSplit = true;
              splitNumeric[splitIndex] = currentSplit;
            } else {
              // Convert any NaN/Infinity to 0
              splitNumeric[splitIndex] = 0;
            }
            const column = splitIndex + 3;
            const contributorId = checkData.contributors[splitIndex].id;

            return (
              <SplitInput
                aria-label={strings["contribution"]}
                checkId={checkId}
                className={`Grid-input Grid-numeric ${rowClass}`}
                data-column={column}
                data-row={row}
                defaultValue={split}
                disabled={loading.active || !writeAccess}
                itemIndex={itemIndex}
                key={`${contributorId}-${split}`} // Use value as key to re-render uncontrolled input
                name={`item:${itemIndex};split:${splitIndex}`}
                setCheckData={setCheckData}
                splitIndex={splitIndex}
                writeAccess={writeAccess}
              />
            );
          });

          if (hasPositiveSplit) {
            // Only add item cost to total if split > 0, otherwise balance could be misleading
            const itemCost = parseCurrencyAmount(locale, currency, item.cost);
            const buyerTotalPaid = totalPaid.get(item.buyer) || dinero({ amount: 0, currency });
            totalPaid.set(item.buyer, add(buyerTotalPaid, dinero({ amount: itemCost, currency })));
            totalCost = add(totalCost, dinero({ amount: itemCost, currency }));

            let splitRatio = [...splitNumeric];
            let isReversed = false;
            if (positiveSplitItemIndex % 2 === 1) {
              // If using allocate() without reversing on every other item, the distribution will be weighted heavier on the starting contributors
              splitRatio.reverse();
              isReversed = true;
            }
            const contributorItemOwing = new Map<number, Dinero<number>>();
            itemOwing.set(itemIndex, contributorItemOwing);
            const splitCosts = allocate(dinero({ amount: itemCost, currency }), splitRatio);
            const splitCostsLength = splitCosts.length;
            splitCosts.forEach((split, splitIndex) => {
              // Un-reverse any splits if necessary
              const adjustedSplitIndex = isReversed
                ? splitCostsLength - 1 - splitIndex
                : splitIndex;
              contributorItemOwing.set(adjustedSplitIndex, split);
              totalOwing.set(
                adjustedSplitIndex,
                add(totalOwing.get(adjustedSplitIndex) || dinero({ amount: 0, currency }), split)
              );
            });
            positiveSplitItemIndex++;
          }

          return (
            <Fragment key={itemId}>
              <NameInput
                aria-labelledby="name"
                checkId={checkId}
                className={`Grid-input ${rowClass}`}
                data-column={0}
                data-row={row}
                defaultValue={item.name}
                disabled={loading.active || !writeAccess}
                itemIndex={itemIndex}
                key={`${itemId}-name-${item.name}`} // Use value as key to re-render uncontrolled input
                name={`item:${itemIndex};name`}
                setCheckData={setCheckData}
                writeAccess={writeAccess}
              />
              <CostInput
                aria-labelledby="cost"
                checkId={checkId}
                className={`Grid-input Grid-numeric ${rowClass}`}
                data-column={1}
                data-row={row}
                defaultValue={item.cost}
                disabled={loading.active || !writeAccess}
                itemIndex={itemIndex}
                key={`${itemId}-cost-${item.cost}`} // Use value as key to re-render uncontrolled input
                name={`item:${itemIndex};cost`}
                setCheckData={setCheckData}
                writeAccess={writeAccess}
              />
              <BuyerSelect
                aria-labelledby="buyer"
                checkId={checkId}
                className={`Grid-input ${rowClass}`}
                data-column={2}
                data-row={row}
                defaultValue={item.buyer}
                disabled={loading.active || !writeAccess}
                itemIndex={itemIndex}
                key={`${itemId}-buyer-${item.buyer}`} // Use value as key to re-render uncontrolled input
                name={`item:${itemIndex};buyer`}
                setCheckData={setCheckData}
                writeAccess={writeAccess}
              >
                {renderBuyerOptions}
              </BuyerSelect>
              {renderSplit}
            </Fragment>
          );
        }),
        itemOwing,
        totalOwing,
        totalPaid,
        totalCost,
      ];
    }, [
      checkData.contributors,
      checkData.items,
      checkId,
      currency,
      loading.active,
      locale,
      renderBuyerOptions,
      setCheckData,
      strings,
      writeAccess,
    ]);

    // Contributor columns
    const renderContributors = useMemo(
      () =>
        checkData.contributors.map((contributor, contributorIndex) => {
          const column = contributorIndex + 3;
          const row = 0;

          return (
            <ContributorInput
              aria-label={strings["contributorName"]}
              checkId={checkId}
              className="Grid-header Grid-input Grid-numeric"
              contributorIndex={contributorIndex}
              data-column={column}
              data-row={row}
              defaultValue={contributor.name}
              disabled={loading.active || !writeAccess}
              key={`${contributor.id}-${contributor.name}`} // Use value as key to re-render uncontrolled input
              name={`contributor:${contributorIndex};name`}
              setCheckData={setCheckData}
              writeAccess={writeAccess}
            />
          );
        }),
      [checkData.contributors, checkId, loading.active, setCheckData, strings, writeAccess]
    );

    // Summary of paid (positive) + owed (negative)
    const [renderTotals, positiveBalances, negativeBalances, isLinked] = useMemo(() => {
      const positiveBalances: NumericBalance = [];
      const negativeBalances: NumericBalance = [];
      let isLinked = false;
      const totals = checkData.contributors.map((contributor, contributorIndex) => {
        const contributorPaidDinero = parseDineroMap(currency, totalPaid, contributorIndex);
        const contributorOwingDinero = parseDineroMap(currency, totalOwing, contributorIndex);
        const balance = parseDineroAmount(subtract(contributorPaidDinero, contributorOwingDinero));
        const numericBalance = { amount: balance, contributor: contributorIndex };
        if (balance < 0) {
          negativeBalances.push(numericBalance);
        } else if (balance > 0) {
          positiveBalances.push(numericBalance);
        }

        const hasLink = contributor.id === userInfo.uid;
        if (hasLink) {
          isLinked = true;
        }

        return (
          <SummaryButton
            balance={balance}
            className="Grid-total Grid-summary"
            contributorIndex={contributorIndex}
            disabled={loading.active} // Allow button click without writeAccess
            key={contributor.id}
            linked={hasLink}
            onClick={handleSummaryClick}
            totalOwing={totalOwing}
            totalPaid={totalPaid}
          />
        );
      });
      // Sort balances descending
      // positiveBalances are read as a queue and negativeBalances are read as a stack
      positiveBalances.sort((a, b) => b.amount - a.amount);
      negativeBalances.sort((a, b) => b.amount - a.amount);
      return [totals, positiveBalances, negativeBalances, isLinked];
    }, [
      checkData.contributors,
      currency,
      handleSummaryClick,
      loading.active,
      totalOwing,
      totalPaid,
      userInfo.uid,
    ]);

    // Must be rendered in this component to prevent hydration issues caused by mutating a memoized object
    const [renderPayments, paymentsStrings] = useMemo(() => {
      const allPaymentsStrings: string[] = [];
      const allPayments = positiveBalances.reduce<JSX.Element[]>((payments, currentReceiver) => {
        // Highest ower pays to the most owed; iterate through list until balanced
        const renderPaymentItems = [];
        const receiverContributor = checkData.contributors[currentReceiver.contributor];
        while (currentReceiver.amount > 0) {
          // Have to recalculate in while loop because positiveBalance is using .pop()
          const currentPayer = negativeBalances.at(-1);
          // const lastIndex = positiveBalances.length - 1;
          // const currentPayer = positiveBalances[lastIndex];
          if (typeof currentPayer !== "undefined") {
            const absolutePayerAmount = Math.abs(currentPayer.amount);
            const paidAmount = Math.min(absolutePayerAmount, currentReceiver.amount);

            // Handle stored payment calculations
            if (absolutePayerAmount === paidAmount) {
              negativeBalances.pop();
            }
            currentReceiver.amount -= paidAmount;
            currentPayer.amount += paidAmount;

            const paymentString = interpolateString(strings["payerPaysReceiverAmount"], {
              amount: formatCurrency(locale, paidAmount),
              payer: checkData.contributors[currentPayer.contributor].name,
              receiver: receiverContributor.name,
            });

            renderPaymentItems.push(
              <span
                className="CheckPayments-item"
                key={`${currentReceiver.contributor}-${currentPayer.contributor}`}
              >
                {paymentString}
              </span>
            );
            allPaymentsStrings.push(paymentString);
          } else {
            // This should never happen if values are allocated properly
            const paymentString = interpolateString(strings["contributorHasAmountUnaccountedFor"], {
              amount: formatCurrency(locale, currentReceiver.amount),
              contributor: receiverContributor.name,
            });
            renderPaymentItems.push(<span key={currentReceiver.contributor}>{paymentString}</span>);
            allPaymentsStrings.push(paymentString);
            currentReceiver.amount = 0;
          }
        }

        const linkedReceiver = checkUsers[receiverContributor.id];
        let renderPaymentAccount;
        if (typeof linkedReceiver === "undefined") {
          renderPaymentAccount = (
            <span className="CheckPayments-account CheckPayments-invalid">
              {interpolateString(strings["paymentAccountUnlinkedHint"], {
                receiver: receiverContributor.name,
              })}
            </span>
          );
        } else if (
          typeof linkedReceiver.payment !== "undefined" &&
          linkedReceiver.payment.type !== "none"
        ) {
          renderPaymentAccount = (
            <div className="CheckPayments-account">
              <span>
                {interpolateString(strings["descriptor"], {
                  descriptee: "",
                  descriptor: strings[linkedReceiver.payment.type],
                })}
              </span>
              <CopyButton>{linkedReceiver.payment.id}</CopyButton>
            </div>
          );
          allPaymentsStrings.push(
            interpolateString(strings["descriptor"], {
              descriptee: linkedReceiver.payment.id,
              descriptor: strings[linkedReceiver.payment.type],
            }),
            "" // Adds a newline to separate receiver amounts when joined
          );
        } else {
          renderPaymentAccount = (
            <span className="CheckPayments-account CheckPayments-invalid">
              {interpolateString(strings["paymentAccountUnsetHint"], {
                user: linkedReceiver.displayName || linkedReceiver.email,
              })}
            </span>
          );
        }
        payments.push(
          <article className="CheckPayments-group" key={currentReceiver.contributor}>
            <div className="CheckPayments-items">{renderPaymentItems}</div>
            <span className="CheckPayments-separator">{strings["separator"]}</span>
            {renderPaymentAccount}
          </article>
        );
        return payments;
      }, []);

      // This should also never happen if values are allocated properly
      negativeBalances.forEach((currentPayer) => {
        const paymentString = interpolateString(strings["contributorHasAmountUnaccountedFor"], {
          amount: formatCurrency(locale, currentPayer.amount),
          contributor: checkData.contributors[currentPayer.contributor].name,
        });
        allPayments.push(<span key={currentPayer.contributor}>{paymentString}</span>);
        allPaymentsStrings.push(paymentString);
        currentPayer.amount = 0;
      });

      return [allPayments, allPaymentsStrings];
    }, [checkData.contributors, checkUsers, locale, negativeBalances, positiveBalances, strings]);

    const handleShareClick: ShareClickHandler = useCallback(async () => {
      try {
        await navigator.share({
          title: title,
          text: paymentsStrings.join("\n"),
          url: accessLink,
        });
      } catch (err) {
        navigator.clipboard.writeText(accessLink);
      }
    }, [accessLink, paymentsStrings, title]);

    useEffect(() => {
      if (scrollElement !== null) {
        const main = mainRef.current;
        if (main !== null) {
          const newColumn = main.querySelector(scrollElement) as HTMLInputElement;
          if (newColumn) {
            newColumn.focus();
          }
        }
      }
    }, [scrollElement]);

    useEffect(() => {
      let pendingUpdate = false;
      const handleResize = (e: Event) => {
        if (pendingUpdate) {
          return;
        }
        pendingUpdate = true;

        requestAnimationFrame(() => {
          pendingUpdate = false;
          if (window.visualViewport && window.innerHeight > window.visualViewport.height) {
            setActionsOffset(window.innerHeight - window.visualViewport.height);
          }
        });
      };
      if (window.visualViewport) {
        window.visualViewport.addEventListener("scroll", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
      return () => {
        window.visualViewport?.removeEventListener("resize", handleResize);
      };
    });

    const renderActionButtons = writeAccess ? (
      <div className="CheckActions-root" style={{ bottom: actionsOffset }}>
        <div className="CheckActions-scroller">
          <div className="CheckActions-buttonGroup">
            <Button
              className="CheckActions-button"
              data-column={-1}
              data-row={-1}
              disabled={loading.active}
              onClick={handleAddItemClick}
              startIcon={<AddCircleOutline />}
              variant="outlined"
            >
              <span className="CheckActions-text">{strings["addItem"]}</span>
            </Button>
            <Button
              className="CheckActions-button"
              data-column={-1}
              data-row={-1}
              disabled={loading.active}
              onClick={handleAddContributorClick}
              startIcon={<PersonAddAlt1Outlined />}
              variant="outlined"
            >
              <span className="CheckActions-text">{strings["addContributor"]}</span>
            </Button>
          </div>
          {deleteItemsAmount > 0 && (
            <Button
              color="error"
              className="CheckActions-button CheckActions-delete"
              data-column={-1}
              data-row={-1}
              disabled={loading.active}
              onClick={handleDeleteItemsClick}
              startIcon={<RemoveCircleOutline />}
              variant="outlined"
            >
              <span className="CheckActions-text">{strings["deleteItem"]}</span>
            </Button>
          )}
          {deleteContributorsAmount > 0 && (
            <Button
              color="error"
              className="CheckActions-button CheckActions-delete"
              data-column={-1}
              data-row={-1}
              disabled={loading.active}
              onClick={handleDeleteContributorsClick}
              startIcon={<PersonRemoveAlt1Outlined />}
              variant="outlined"
            >
              <span className="CheckActions-text">{strings["deleteContributor"]}</span>
            </Button>
          )}
        </div>
      </div>
    ) : null;

    return (
      <main className={`Body-root ${className}`} onScroll={onScroll} ref={mainRef}>
        <section className="Grid-root">
          <form
            className="Grid-data"
            id="checkForm"
            onBlur={handleGridBlur}
            onFocus={handleGridFocus}
          >
            <span className="Grid-header Grid-text" id="name">
              {strings["item"]}
            </span>
            <span className="Grid-header Grid-text Grid-numeric" id="cost">
              {strings["cost"]}
            </span>
            <span className="Grid-header Grid-text" id="buyer">
              {strings["buyer"]}
            </span>
            {renderContributors}
            {renderItems}
            {renderActionButtons}
          </form>
          <div className="Grid-footer Grid-numeric Grid-total CheckTotal-root">
            <span className="CheckTotal-header">{strings["checkTotal"]}</span>
            <span className="CheckTotal-value">
              {formatCurrency(locale, parseDineroAmount(totalCost))}
            </span>
          </div>
          <div className="Grid-total">
            <span className="Grid-footer">{strings["paid"]}</span>
            <span className="Grid-footer">{strings["owing"]}</span>
            <span className="Grid-footer">{strings["balance"]}</span>
          </div>
          {renderTotals}
        </section>
        {renderPayments.length > 0 && (
          <section className="CheckPayments-root">
            <article className="CheckPayments-header">
              <IconButton
                aria-label={strings["share"]}
                className="CheckPayments-share"
                color="primary"
                disabled={loading.active}
                onClick={handleShareClick}
              >
                <Share />
              </IconButton>
              {!isLinked && <Hint>{strings["linkPaymentsHint"]}</Hint>}
            </article>
            {renderPayments}
          </section>
        )}
        <Summary
          checkData={checkData}
          checkId={checkId}
          checkUsers={checkUsers}
          contributorIndex={summaryContributor}
          itemOwing={itemOwing}
          onClose={handleSummaryDialogClose}
          open={hash === "#summary"}
          setCheckData={setCheckData}
          strings={strings}
          totalOwing={totalOwing}
          totalPaid={totalPaid}
          writeAccess={writeAccess}
        />
      </main>
    );
  }
)`
  ${({ checkData, theme, writeAccess }) => `
    align-items: flex-start;
    background: ${theme.palette.background.secondary};
    display: flex;
    flex: 1;
    flex-direction: column;
    font-family: ${firaCode.style.fontFamily};
    overflow: auto;

    & .CheckActions-root {
      background: ${theme.palette.background.secondary};
      border-top: 2px solid ${theme.palette.divider};
      bottom: 0;
      grid-column: 1 / -1;
      margin-bottom: ${theme.spacing(2)};
      padding: ${theme.spacing(1, 0)};
      position: sticky;

      & .CheckActions-button {
        ${theme.breakpoints.down("md")} {
          & .CheckActions-text {
            display: none;
          }

          & .MuiButton-startIcon {
            margin: 0;
          }
        }
      }

      & .CheckActions-buttonGroup {
        display: flex;
        gap: ${theme.spacing(2)};
      }

      & .CheckActions-scroller {
        display: flex;
        gap: ${theme.spacing(2)};
        justify-content: center;
        left: 0;
        max-width: 100vw;
        position: sticky;
        white-space: nowrap;
        width: 100%;

      }
    }

    & .CheckPayments-root {
      border: 2px solid ${theme.palette.secondary[theme.palette.mode]};
      border-radius: ${theme.shape.borderRadius}px;
      display: inline-flex;
      flex-direction: column;
      padding-bottom: ${theme.spacing(2)};
      position: sticky;
      word-break: break-word;

      ${theme.breakpoints.down("md")} {
        gap: ${theme.spacing(1)};
        left: ${theme.spacing(1)};
        margin: ${theme.spacing(1)};

        & .CheckPayments-group {
          flex-direction: column;
          gap: ${theme.spacing(1)};

          &:not(:last-of-type) {
            padding-bottom: ${theme.spacing(1)};
          }

          & .CheckPayments-separator {
            display: none;
          }
        }
      }

      ${theme.breakpoints.up("md")} {
        gap: ${theme.spacing(2)};
        left: ${theme.spacing(2)};
        margin: ${theme.spacing(2)};

        & .CheckPayments-group {
          align-items: center;
          gap: ${theme.spacing(2)};

          &:not(:last-of-type) {
            padding-bottom: ${theme.spacing(2)};
          }

          & .CheckPayments-separator {
            color: ${theme.palette.text.disabled};
          }
        }
      }

      & .CheckPayments-account {
        display: flex;
        font-family: ${comfortaa.style.fontFamily};
        font-weight: 700;

        ${theme.breakpoints.down("sm")} {
          align-items: flex-start;
          flex-direction: column;
        }

        ${theme.breakpoints.up("sm")} {
          align-items: center;
        }

        &.CheckPayments-invalid {
          color: ${theme.palette.text.disabled};
        }
      }

      & .CheckPayments-group {
        display: flex;
        padding: ${theme.spacing(0, 2)};

        &:not(:last-of-type) {
          border-bottom: 2px dashed ${theme.palette.divider};
        }
      }

      & .CheckPayments-header {
        align-items: center;
        border-bottom: 2px dashed ${theme.palette.divider};
        display: flex;
        flex-direction: row-reverse;
        font-family: ${comfortaa.style.fontFamily};
        font-weight: 700;
        justify-content: space-between;
        padding: ${theme.spacing(1, 1, 1, 2)};
      }

      & .CheckPayments-item {
        display: flex;

        & .MuiButtonBase-root {
          line-height: 1;
          padding: ${theme.spacing(0.5, 1)};
        }
      }

      & .Hint-root {
        color: ${theme.palette.warning.main};
      }
    }

    & .CheckTotal-root {
      font-family: ${firaCode.style.fontFamily};
      grid-column: span 2;
      justify-content: center;
      text-align: center;

      & .CheckTotal-header {
        font-size: 1.25rem;
        text-align: center;
      }

      & .CheckTotal-value {
        font-size: 1.75rem;
        font-weight: 400;
        text-align: center;
      }
    }

    & .Grid-root {
      display: grid;
      // Add explicit columns and rows to allow use of negative positioning in grid
      // Item column can't rely on max-content alone since <input> doesn't fit to its content
      grid-template-columns: 1fr min-content min-content ${
        checkData.contributors.length ? `repeat(${checkData.contributors.length}, min-content)` : ""
      };
      grid-template-rows: min-content repeat(
        ${checkData.items.length}, ${writeAccess ? "min-content" : ""}
      );
      width: 100%;
      position: relative;

      & .Grid-data {
        display: contents;
      }

      & .Grid-footer {
        color: ${theme.palette.text.disabled};
        height: 100%;
        white-space: nowrap;
      }

      & .Grid-header {
        border-bottom: 2px solid ${theme.palette.divider};
        height: 100%;
        position: sticky;
        top: 0;
        z-index: 100;

        &.Grid-text, &:not(:focus):not(:hover) {
          background: ${theme.palette.background.secondary};
        }
      }

      & .Grid-input {
        height: 100%;

        &:not(:disabled):not(:hover):not(:focus) {
          &.Grid-alternate {
            background: ${
              theme.palette.mode === "dark"
                ? lighten(theme.palette.background.secondary!, theme.palette.action.hoverOpacity)
                : darken(theme.palette.background.secondary!, theme.palette.action.hoverOpacity)
            };
            // Use lighten/darken to prevent transparent background
          }
        }
      }

      & .Grid-linked {
        outline: 2px solid ${theme.palette.divider};
        outline-offset: -2px;
        outline-style: dashed;

        & .MuiBadge-badge {
          left: ${theme.spacing(2)};
        }
      }

      & .Grid-negative {
        color: ${theme.palette.error.main};
      }

      & .Grid-numeric {
        text-align: right;
      }

      & .Grid-summary {
        align-items: flex-end;
        border-radius: 0;
        font-family: inherit;
        font-weight: inherit;
        transition: none;
        white-space: nowrap;

        &:not(.Mui-disabled) {
          color: inherit;
        }
      }

      & .Grid-text {
        color: ${theme.palette.text.disabled};
        white-space: nowrap;

        ${theme.breakpoints.down("sm")} {
          padding: ${theme.spacing(1)};
        }

        ${theme.breakpoints.up("sm")} {
          padding: ${theme.spacing(1, 2)};
        }
      }

      & .Grid-total {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: ${theme.spacing(1)};
        height: 100%;

        ${theme.breakpoints.down("sm")} {
          padding: ${theme.spacing(1)};
        }

        ${theme.breakpoints.up("sm")} {
          padding: ${theme.spacing(2)};
        }
      }
    }
  `}
`;

Body.displayName = "Body";
