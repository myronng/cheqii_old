import {
  AddCircle,
  AddCircleOutline,
  PersonAdd,
  PersonAddOutlined,
  PlaylistAdd,
} from "@mui/icons-material";
import { Button, Divider } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { BuyerSelect } from "components/check/CheckDisplay/BuyerSelect";
import { CheckActionButton } from "components/check/CheckDisplay/CheckActionButton";
import { CheckSummary, CheckSummaryProps } from "components/check/CheckDisplay/CheckSummary";
import {
  SummaryButton,
  SummaryButtonProps,
} from "components/check/CheckDisplay/CheckSummary/SummaryButton";
import { ContributorInput } from "components/check/CheckDisplay/ContributorInput";
import { CostInput } from "components/check/CheckDisplay/CostInput";
import { FloatingMenu, FloatingMenuOption } from "components/check/CheckDisplay/FloatingMenu";
import { NameInput } from "components/check/CheckDisplay/NameInput";
import { SplitInput } from "components/check/CheckDisplay/SplitInput";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, CheckDataForm } from "declarations";
import { add, allocate, Dinero, dinero, subtract } from "dinero.js";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { ShareClickHandler } from "pages/check/[checkId]";
import {
  Dispatch,
  FocusEventHandler,
  ForwardedRef,
  forwardRef,
  Fragment,
  SetStateAction,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { db, generateUid } from "services/firebase";
import { formatCurrency, formatInteger, interpolateString } from "services/formatter";
import { getCurrencyType } from "services/locale";
import {
  parseCurrencyAmount,
  parseDineroAmount,
  parseDineroMap,
  parseRatioAmount,
} from "services/parser";
import { checkDataToCheck, itemStateToItem } from "services/transformer";

type NumericBalance = {
  amount: number;
  contributor: number;
}[];

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  checkData: CheckDataForm;
  checkId: string;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export type CheckDisplayRef = {
  paymentsStrings: string[];
};

export type ItemPaymentMap = Map<number, PaymentMap>;

export type PaymentMap = Map<number, Dinero<number>>;

const CheckDisplayUnstyled = forwardRef(
  (
    { className, checkData, checkId, setCheckData, strings, writeAccess }: CheckDisplayProps,
    ref: ForwardedRef<CheckDisplayRef>
  ) => {
    const router = useRouter();
    const locale = router.locale ?? String(router.defaultLocale);
    const currency = getCurrencyType(locale);
    const { loading } = useLoading();
    const { setSnackbar } = useSnackbar();
    const [selection, setSelection] = useState<{
      anchor: HTMLElement;
      column: number;
      options: FloatingMenuOption[];
      row: number;
    } | null>(null);
    const [checkSummaryContributor, setCheckSummaryContributor] = useState(-1);
    const [checkSummaryOpen, setCheckSummaryOpen] = useState(false); // Use separate open state so data doesn't clear during dialog animation

    const handleAddContributorClick = useCallback(async () => {
      try {
        if (writeAccess) {
          setCheckData((stateCheckData) => {
            // Must shallow copy contributors for memo dependencies that rely on checkData.contributors explicitly
            const newContributors = [...stateCheckData.contributors];
            const newItems = [...stateCheckData.items];
            newContributors.push({
              id: generateUid(),
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
              id: generateUid(),
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

    const handleFloatingMenuBlur: FocusEventHandler<HTMLDivElement> = useCallback(
      (e) => {
        if (writeAccess) {
          if (!e.relatedTarget?.closest(".FloatingMenu-root")) {
            setSelection(null);
          }
        }
      },
      [writeAccess]
    );

    const handleGridBlur: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
      if (writeAccess) {
        if (
          !e.relatedTarget?.closest(".FloatingMenu-root") && // Use optional chaining to allow e.relatedTarget === null
          !e.relatedTarget?.classList.contains("FloatingMenu-root")
        ) {
          setSelection(null);
        }
      }
    };

    const handleGridFocus: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
      if (writeAccess) {
        const column = Number(e.target.dataset.column);
        const row = Number(e.target.dataset.row);
        const floatingMenuOptions: FloatingMenuOption[] = [];
        // Account for contributor row
        if (row >= 1) {
          const itemIndex = row - 1;
          floatingMenuOptions.push({
            color: "error",
            id: "deleteRow",
            label: strings["deleteRow"],
            onClick: async () => {
              try {
                setSelection(null);

                if (writeAccess) {
                  setCheckData((stateCheckData) => {
                    const newItems = stateCheckData.items.filter(
                      (_value, filterIndex) => filterIndex !== itemIndex
                    );
                    const checkDoc = doc(db, "checks", checkId);
                    updateDoc(checkDoc, {
                      items: itemStateToItem(newItems, locale, currency),
                      updatedAt: Date.now(),
                    });
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
            },
          });
        }
        // Account for item name, cost, and buyer columns
        if (column >= 3) {
          const contributorIndex = column - 3;
          floatingMenuOptions.push({
            color: "error",
            id: "deleteColumn",
            label: strings["deleteColumn"],
            onClick: async () => {
              try {
                setSelection(null);

                // Check for writeAccess to handle access being changed after initial render
                if (writeAccess) {
                  setCheckData((stateCheckData) => {
                    const newContributors = stateCheckData.contributors.filter(
                      (_value, contributorFilterIndex) =>
                        contributorFilterIndex !== contributorIndex
                    );
                    const newItems = stateCheckData.items.map((item) => {
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

                    const checkDoc = doc(db, "checks", checkId);
                    const newStateCheckData = { items: newItems, contributors: newContributors };
                    const docCheckData = checkDataToCheck(newStateCheckData, locale, currency);
                    updateDoc(checkDoc, {
                      ...docCheckData,
                      updatedAt: Date.now(),
                    });

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
            },
          });
        }
        setSelection({
          anchor: e.target,
          column,
          options: floatingMenuOptions,
          row,
        });
      }
    };

    const handleSummaryClick: SummaryButtonProps["onClick"] = useCallback(
      (_e, contributorIndex) => {
        setCheckSummaryOpen(true);
        setCheckSummaryContributor(contributorIndex);
      },
      []
    );

    const handleSummaryDialogClose: CheckSummaryProps["onClose"] = useCallback(() => {
      setCheckSummaryOpen(false);
    }, []);

    // Buyer dropdown options
    const renderBuyerOptions = useMemo(
      () =>
        checkData.contributors.map((contributor, contributorIndex) => (
          <option className="Select-option" key={contributor.id} value={contributorIndex}>
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

            let className = "";
            if (selection !== null) {
              if (selection.column === column && selection.row === row) {
                className = "selected";
              } else if (selection.column === column || selection.row === row) {
                className = "peripheral";
              }
            }

            return (
              <SplitInput
                aria-label={strings["contribution"]}
                checkId={checkId}
                className={`Grid-input Grid-numeric ${className}`}
                data-column={column}
                data-row={row}
                disabled={loading.active || !writeAccess}
                itemIndex={itemIndex}
                key={contributorId}
                setCheckData={setCheckData}
                splitIndex={splitIndex}
                value={split}
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

          let buyerClassName = "",
            costClassName = "",
            nameClassName = "";
          if (selection !== null) {
            if (selection.row === row) {
              if (selection.column === 0) {
                buyerClassName = "peripheral";
                costClassName = "peripheral";
                nameClassName = "selected";
              } else if (selection.column === 1) {
                buyerClassName = "peripheral";
                costClassName = "selected";
                nameClassName = "peripheral";
              } else if (selection.column === 2) {
                buyerClassName = "selected";
                costClassName = "peripheral";
                nameClassName = "peripheral";
              } else {
                buyerClassName = "peripheral";
                costClassName = "peripheral";
                nameClassName = "peripheral";
              }
            } else {
              if (selection.column === 0) {
                nameClassName = "peripheral";
              } else if (selection.column === 1) {
                costClassName = "peripheral";
              } else if (selection.column === 2) {
                buyerClassName = "peripheral";
              }
            }
          }

          return (
            <Fragment key={itemId}>
              <NameInput
                aria-labelledby="name"
                checkId={checkId}
                className={`Grid-input ${nameClassName}`}
                data-column={0}
                data-row={row}
                disabled={loading.active || !writeAccess}
                itemIndex={itemIndex}
                setCheckData={setCheckData}
                value={item.name}
                writeAccess={writeAccess}
              />
              <CostInput
                aria-labelledby="cost"
                checkId={checkId}
                className={`Grid-input Grid-numeric ${costClassName}`}
                data-column={1}
                data-row={row}
                disabled={loading.active || !writeAccess}
                itemIndex={itemIndex}
                setCheckData={setCheckData}
                value={item.cost}
                writeAccess={writeAccess}
              />
              <BuyerSelect
                aria-labelledby="buyer"
                checkId={checkId}
                className={`Grid-input ${buyerClassName}`}
                data-column={2}
                data-row={row}
                disabled={loading.active || !writeAccess}
                itemIndex={itemIndex}
                setCheckData={setCheckData}
                value={item.buyer}
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
      selection,
    ]);

    // Contributor columns
    const renderContributors = useMemo(
      () =>
        checkData.contributors.map((contributor, contributorIndex) => {
          const column = contributorIndex + 3;
          const row = 0;

          let className = "";
          if (selection !== null) {
            if (selection.column === column && selection.row === row) {
              className = "selected";
            } else if (selection.column === column || selection.row === row) {
              className = "peripheral";
            }
          }

          return (
            <ContributorInput
              aria-label={strings["contributorName"]}
              checkId={checkId}
              className={`Grid-input Grid-numeric ${className}`}
              contributorIndex={contributorIndex}
              data-column={column}
              data-row={row}
              disabled={loading.active || !writeAccess}
              key={contributor.id}
              setCheckData={setCheckData}
              value={contributor.name}
              writeAccess={writeAccess}
            />
          );
        }),
      [
        checkData.contributors,
        checkId,
        loading.active,
        setCheckData,
        strings,
        writeAccess,
        selection,
      ]
    );

    // Summary of paid + owed
    const [renderTotals, positiveBalances, negativeBalances] = useMemo(() => {
      const positiveBalances: NumericBalance = [];
      const negativeBalances: NumericBalance = [];
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

        return (
          <SummaryButton
            balance={balance}
            className="Grid-total Grid-summary"
            contributorIndex={contributorIndex}
            disabled={loading.active} // Allow button click without writeAccess
            key={contributor.id}
            onClick={handleSummaryClick}
            totalOwing={totalOwing}
            totalPaid={totalPaid}
          />
        );
      });
      return [totals, positiveBalances, negativeBalances];
    }, [
      checkData.contributors,
      currency,
      handleSummaryClick,
      loading.active,
      totalOwing,
      totalPaid,
    ]);

    const [renderPayments, paymentsStrings] = useMemo(() => {
      // Sort negative and positive balances descending, positive balances are read as a stack
      positiveBalances.sort((a, b) => a.amount - b.amount);
      negativeBalances.sort((a, b) => a.amount - b.amount);

      const allPaymentsStrings: string[] = [];
      const allPayments = negativeBalances.reduce<JSX.Element[]>((payments, currentPayer) => {
        // Highest ower pays to the most owed; iterate through list until balanced
        while (currentPayer.amount < 0) {
          // Have to recalculate in while loop because positiveBalance is using .pop()
          const lastIndex = positiveBalances.length - 1;
          // Vercel doesn't support .at() as of 2022-07-09
          // const receiver = positiveBalances.at(-1);
          const receiver = positiveBalances[lastIndex];
          if (typeof receiver !== "undefined") {
            const absolutePayerAmount = Math.abs(currentPayer.amount);
            const receiverAmount = receiver.amount;
            const paidAmount = Math.min(absolutePayerAmount, receiverAmount);
            if (absolutePayerAmount >= receiverAmount) {
              positiveBalances.pop();
            } else {
              receiver.amount -= absolutePayerAmount;
            }
            currentPayer.amount += paidAmount;
            const paymentString = interpolateString(strings["payerPaysReceiverAmount"], {
              amount: formatCurrency(locale, paidAmount),
              payer: checkData.contributors[currentPayer.contributor].name,
              receiver: checkData.contributors[receiver.contributor].name,
            });

            payments.push(
              <span key={`${currentPayer.contributor}-${receiver.contributor}`}>
                {paymentString}
              </span>
            );
            allPaymentsStrings.push(paymentString);
          } else {
            // This should never happen if values are allocated properly
            const paymentString = interpolateString(strings["contributorHasAmountUnaccountedFor"], {
              amount: formatCurrency(locale, currentPayer.amount),
              contributor: checkData.contributors[currentPayer.contributor].name,
            });
            payments.push(<span key={currentPayer.contributor}>{paymentString}</span>);
            allPaymentsStrings.push(paymentString);
            currentPayer.amount = 0;
          }
        }
        return payments;
      }, []);

      // This should also never happen if values are allocated properly
      positiveBalances.forEach((currentReceiver) => {
        const paymentString = interpolateString(strings["contributorHasAmountUnaccountedFor"], {
          amount: formatCurrency(locale, currentReceiver.amount),
          contributor: checkData.contributors[currentReceiver.contributor].name,
        });
        allPayments.push(<span key={currentReceiver.contributor}>{paymentString}</span>);
        allPaymentsStrings.push(paymentString);
        currentReceiver.amount = 0;
      });

      return [allPayments, allPaymentsStrings];
    }, [checkData.contributors, locale, negativeBalances, positiveBalances, strings]);

    const renderAddButtons = writeAccess ? (
      <>
        <Button
          className="CheckButtonAdd-common CheckButtonAdd-item"
          disabled={loading.active}
          onClick={handleAddItemClick}
        >
          <AddCircleOutline />
        </Button>
        <Button
          className="CheckButtonAdd-common CheckButtonAdd-contributor"
          disabled={loading.active}
          onClick={handleAddContributorClick}
        >
          <PersonAddOutlined />
        </Button>
      </>
    ) : null;

    useImperativeHandle(
      ref,
      () => ({
        paymentsStrings,
      }),
      [paymentsStrings]
    );

    return (
      <div className={`Body-root ${className}`}>
        <section className="Grid-container">
          <section className="Grid-data" onBlur={handleGridBlur} onFocus={handleGridFocus}>
            <span className="Grid-header" id="name">
              {strings["item"]}
            </span>
            <span className="Grid-header Grid-numeric" id="cost">
              {strings["cost"]}
            </span>
            <span className="Grid-header" id="buyer">
              {strings["buyer"]}
            </span>
            {renderContributors}
            {renderItems}
            {renderAddButtons}
          </section>
          <Divider className="Grid-divider" />
          <section className="Grid-footer Grid-numeric Grid-total CheckTotal-root">
            <span className="CheckTotal-header">{strings["checkTotal"]}</span>
            <span className="CheckTotal-value">
              {formatCurrency(locale, parseDineroAmount(totalCost))}
            </span>
          </section>
          <div className="Grid-total">
            <span className="Grid-footer">{strings["totalPaid"]}</span>
            <span className="Grid-footer">{strings["totalOwing"]}</span>
            <span className="Grid-footer">{strings["balance"]}</span>
          </div>
          {renderTotals}
        </section>
        {renderPayments.length > 0 && (
          <section className="CheckPayments-root">{renderPayments}</section>
        )}
        <FloatingMenu
          onBlur={handleFloatingMenuBlur}
          options={selection?.options}
          PopperProps={{ anchorEl: selection?.anchor }}
        />
        <CheckSummary
          checkData={checkData}
          contributorIndex={checkSummaryContributor}
          itemOwing={itemOwing}
          onClose={handleSummaryDialogClose}
          open={checkSummaryOpen}
          strings={strings}
          totalOwing={totalOwing}
          totalPaid={totalPaid}
        />
      </div>
    );
  }
);

export const CheckDisplay = styled(CheckDisplayUnstyled)`
  ${({ checkData, theme, writeAccess }) => `
    align-items: flex-start;
    border-top: 2px solid ${theme.palette.secondary.main};
    background: ${theme.palette.background.secondary};
    display: flex;
    flex: 1;
    flex-direction: column;
    font-family: Fira Code;
    overflow: auto;

    & .CheckButtonAdd-common {
      border-radius: 0;
      transition: none;
    }

    & .CheckButtonAdd-contributor {
      grid-column: -1/-2;
      grid-row: 1/-1;
      height: 100%;
    }

    & .CheckButtonAdd-item {
      grid-column: 1/-2;
      grid-row: -1/-1;
    }

    & .CheckPayments-root {
      border: 2px solid ${theme.palette.secondary.main};
      border-radius: ${theme.shape.borderRadius}px;
      display: inline-flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(2)};
      margin: ${theme.spacing(2)};
    }

    & .Grid-container {
      align-items: center;
      display: inline-grid;
      // Add explicit columns and rows to allow use of negative positioning in grid
      // Item column can't rely on max-content alone since <input> doesn't fit to its content
      grid-template-columns: 1fr min-content min-content ${
        checkData.contributors.length
          ? `repeat(${checkData.contributors.length}, min-content) ${
              writeAccess ? "min-content" : ""
            }`
          : ""
      };
      grid-template-rows: min-content repeat(${checkData.items.length}, ${
    writeAccess ? "min-content" : ""
  });
      padding: ${theme.spacing(1, 2)};
      max-width: 100%;
    }

    & .Grid-data {
      display: contents;
    }

    & .Grid-divider {
      grid-column: 1 / -1;
      margin: ${theme.spacing(1, 0)};
    }

    & .Grid-footer {
      color: ${theme.palette.text.disabled};
      height: 100%;
      white-space: nowrap;
    }

    & .Grid-header {
      color: ${theme.palette.text.disabled};
      padding: ${theme.spacing(1, 2)};
      white-space: nowrap;
    }

    & .Grid-input {
      height: 100%;

      &:not(:disabled) {
        &:not(.selected) {
          &.peripheral {
            background: ${theme.palette.action.focus};
            // Use focus for .peripheral and disabled for .selected to not conflict with hover
          }
        }

        &.selected {
          background: ${theme.palette.action.disabled};
          outline: 2px solid ${theme.palette.primary.main};
        }
      }
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

    & .Grid-total {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      height: 100%;
      padding: ${theme.spacing(1, 2)};
    }

    & .CheckTotal-root {
      font-family: Fira Code;
      grid-column: span 2;
      justify-content: center;
      text-align: center;

      & .CheckTotal-header {
        font-size: 1.5rem;
      }

      & .CheckTotal-value {
        font-size: 2.25rem;
        font-weight: 400;
      }
    }
  `}
`;

CheckDisplay.displayName = "CheckDisplay";
CheckDisplayUnstyled.displayName = "CheckDisplayUnstyled";
