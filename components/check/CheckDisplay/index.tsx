import { Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
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
import { CheckSettingsProps } from "components/check/CheckHeader/CheckSettings";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, CheckDataForm } from "declarations";
import { add, allocate, Dinero, dinero } from "dinero.js";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import {
  Dispatch,
  FocusEventHandler,
  Fragment,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { db } from "services/firebase";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { parseCurrencyAmount, parseDineroAmount, parseRatioAmount } from "services/parser";
import { checkDataToCheck, itemStateToItem } from "services/transformer";

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  checkData: CheckDataForm;
  checkId: string;
  onShareClick: CheckSettingsProps["onShareClick"];
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export type ItemPaymentMap = Map<number, PaymentMap>;

export type PaymentMap = Map<number, Dinero<number>>;

export const CheckDisplay = styled((props: CheckDisplayProps) => {
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale!;
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

  const handleFloatingMenuBlur: FocusEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (props.writeAccess) {
        if (!e.relatedTarget?.closest(".FloatingMenu-root")) {
          setSelection(null);
        }
      }
    },
    [props.writeAccess]
  );

  const handleGridBlur: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (props.writeAccess) {
      if (
        !e.relatedTarget?.closest(".FloatingMenu-root") && // Use optional chaining to allow e.relatedTarget === null
        !e.relatedTarget?.classList.contains("FloatingMenu-root")
      ) {
        setSelection(null);
      }
    }
  };

  const handleGridFocus: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (props.writeAccess) {
      const column = Number(e.target.dataset.column);
      const row = Number(e.target.dataset.row);
      const floatingMenuOptions: FloatingMenuOption[] = [];
      // Account for contributor row
      if (row >= 1) {
        const itemIndex = row - 1;
        floatingMenuOptions.push({
          color: "error",
          id: "deleteRow",
          label: props.strings["deleteRow"],
          onClick: async () => {
            try {
              setSelection(null);

              if (props.writeAccess) {
                props.setCheckData((stateCheckData) => {
                  const newItems = stateCheckData.items.filter(
                    (_value, filterIndex) => filterIndex !== itemIndex
                  );
                  const checkDoc = doc(db, "checks", props.checkId);
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
          label: props.strings["deleteColumn"],
          onClick: async () => {
            try {
              setSelection(null);

              // Check for writeAccess to handle access being changed after initial render
              if (props.writeAccess) {
                props.setCheckData((stateCheckData) => {
                  const newContributors = stateCheckData.contributors.filter(
                    (_value, contributorFilterIndex) => contributorFilterIndex !== contributorIndex
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

                  const checkDoc = doc(db, "checks", props.checkId);
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

  const handleSummaryClick: SummaryButtonProps["onClick"] = useCallback((_e, contributorIndex) => {
    setCheckSummaryOpen(true);
    setCheckSummaryContributor(contributorIndex);
  }, []);

  const handleSummaryDialogClose: CheckSummaryProps["onClose"] = useCallback(() => {
    setCheckSummaryOpen(false);
  }, []);

  const renderBuyerOptions = useMemo(
    () =>
      props.checkData.contributors.map((contributor, contributorIndex) => (
        <option className="Select-option" key={contributor.id} value={contributorIndex}>
          {contributor.name}
        </option>
      )),
    [props.checkData.contributors]
  );

  const [renderItems, itemOwing, totalOwing, totalPaid, totalCost] = useMemo(() => {
    let positiveSplitItemIndex = 0;
    let totalCost = dinero({ amount: 0, currency });
    const itemOwing: ItemPaymentMap = new Map();
    const totalPaid: PaymentMap = new Map();
    const totalOwing: PaymentMap = new Map();
    return [
      props.checkData.items.map((item, itemIndex) => {
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
          const contributorId = props.checkData.contributors[splitIndex].id;

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
              aria-label={props.strings["contribution"]}
              checkId={props.checkId}
              className={`Grid-input Grid-numeric ${className}`}
              data-column={column}
              data-row={row}
              disabled={loading.active || !props.writeAccess}
              itemIndex={itemIndex}
              key={contributorId}
              setCheckData={props.setCheckData}
              splitIndex={splitIndex}
              value={split}
              writeAccess={props.writeAccess}
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
            const adjustedSplitIndex = isReversed ? splitCostsLength - 1 - splitIndex : splitIndex;
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
              checkId={props.checkId}
              className={`Grid-input ${nameClassName}`}
              data-column={0}
              data-row={row}
              disabled={loading.active || !props.writeAccess}
              itemIndex={itemIndex}
              setCheckData={props.setCheckData}
              value={item.name}
              writeAccess={props.writeAccess}
            />
            <CostInput
              aria-labelledby="cost"
              checkId={props.checkId}
              className={`Grid-input Grid-numeric ${costClassName}`}
              data-column={1}
              data-row={row}
              disabled={loading.active || !props.writeAccess}
              itemIndex={itemIndex}
              setCheckData={props.setCheckData}
              value={item.cost}
              writeAccess={props.writeAccess}
            />
            <BuyerSelect
              aria-labelledby="buyer"
              checkId={props.checkId}
              className={`Grid-input ${buyerClassName}`}
              data-column={2}
              data-row={row}
              disabled={loading.active || !props.writeAccess}
              itemIndex={itemIndex}
              setCheckData={props.setCheckData}
              value={item.buyer}
              writeAccess={props.writeAccess}
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
    currency,
    loading.active,
    locale,
    props.checkData.contributors,
    props.checkData.items,
    props.writeAccess,
    selection,
  ]);

  const renderContributors = useMemo(
    () =>
      props.checkData.contributors.map((contributor, contributorIndex) => {
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
            aria-label={props.strings["contributorName"]}
            checkId={props.checkId}
            className={`Grid-input Grid-numeric ${className}`}
            contributorIndex={contributorIndex}
            data-column={column}
            data-row={row}
            disabled={loading.active || !props.writeAccess}
            key={contributor.id}
            setCheckData={props.setCheckData}
            value={contributor.name}
            writeAccess={props.writeAccess}
          />
        );
      }),
    [props.checkData.contributors, loading.active, props.writeAccess, selection]
  );

  const renderTotals = useMemo(
    () =>
      props.checkData.contributors.map((contributor, contributorIndex) => (
        <SummaryButton
          className="Grid-total Grid-summary"
          contributorIndex={contributorIndex}
          disabled={loading.active} // Allow button click without writeAccess
          key={contributor.id}
          onClick={handleSummaryClick}
          totalOwing={totalOwing}
          totalPaid={totalPaid}
        />
      )),
    [props.checkData, loading.active]
  );

  return (
    <div className={`Body-root Grid-container ${props.className}`}>
      <section className="Grid-data" onBlur={handleGridBlur} onFocus={handleGridFocus}>
        <span className="Grid-header" id="name">
          {props.strings["item"]}
        </span>
        <span className="Grid-header Grid-numeric" id="cost">
          {props.strings["cost"]}
        </span>
        <span className="Grid-header" id="buyer">
          {props.strings["buyer"]}
        </span>
        {renderContributors}
        {renderItems}
      </section>
      <Divider className="Grid-divider" />
      <section className="Grid-footer Grid-numeric Grid-total CheckTotal-root">
        <span className="CheckTotal-header">{props.strings["checkTotal"]}</span>
        <span className="CheckTotal-value">
          {formatCurrency(locale, parseDineroAmount(totalCost))}
        </span>
      </section>
      <div className="Grid-total">
        <span className="Grid-footer">{props.strings["totalPaid"]}</span>
        <span className="Grid-footer">{props.strings["totalOwing"]}</span>
        <span className="Grid-footer">{props.strings["balance"]}</span>
      </div>
      {renderTotals}
      <FloatingMenu
        onBlur={handleFloatingMenuBlur}
        options={selection?.options}
        PopperProps={{ anchorEl: selection?.anchor }}
      />
      <CheckSummary
        checkData={props.checkData}
        contributorIndex={checkSummaryContributor}
        itemOwing={itemOwing}
        onClose={handleSummaryDialogClose}
        open={checkSummaryOpen}
        strings={props.strings}
        totalOwing={totalOwing}
        totalPaid={totalPaid}
      />
      <CheckActionButton
        checkId={props.checkId}
        onShareClick={props.onShareClick}
        setCheckData={props.setCheckData}
        strings={props.strings}
        writeAccess={props.writeAccess}
      />
    </div>
  );
})`
  ${({ checkData, theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    // Item column can't rely on max-content alone since <input> doesn't fit to its content
    grid-template-columns: 1fr min-content min-content ${
      checkData.contributors.length ? `repeat(${checkData.contributors.length}, min-content)` : ""
    };
    min-width: 100%;
    overflow: auto;
    padding: ${theme.spacing(1, 2)};

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
      color: inherit;
      font-family: inherit;
      font-weight: inherit;
      transition: none;
      white-space: nowrap;
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
