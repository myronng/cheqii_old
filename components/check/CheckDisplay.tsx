import { alpha, styled } from "@material-ui/core/styles";
import { add, allocate, Dinero, dinero, subtract, toSnapshot } from "dinero.js";
import { Select } from "components/check/Select";
import { Input } from "components/check/Input";
import { Check, Contributor, Item, StyledProps } from "declarations";
import { ChangeEvent, FocusEvent } from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { useRouter } from "next/router";

type TransactionType = "new" | "existing";

export type CheckDisplayProps = StyledProps & {
  contributors: NonNullable<Check["contributors"]>;
  items: Item[];
  loading: boolean;
  localContributors: Contributor[];
  localItems: Item[];
  onBuyerChange: (
    event: ChangeEvent<HTMLSelectElement>,
    type: TransactionType,
    index: number
  ) => void;
  onContributorBlur: (
    event: FocusEvent<HTMLInputElement>,
    type: TransactionType,
    index: number
  ) => void;
  onCostBlur: (event: FocusEvent<HTMLInputElement>, type: TransactionType, index: number) => void;
  onItemNameBlur: (
    event: FocusEvent<HTMLInputElement>,
    type: TransactionType,
    index: number
  ) => void;
  onSplitBlur: (
    event: FocusEvent<HTMLInputElement>,
    type: TransactionType,
    itemIndex: number,
    splitIndex: number
  ) => void;
};

export const CheckDisplay = styled((props: CheckDisplayProps) => {
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale!;
  const currency = getCurrencyType(locale);
  const allContributors = props.contributors.concat(props.localContributors);
  const allItems = props.items.concat(props.localItems);
  const contributorsLength = props.contributors.length;
  const itemsLength = props.items.length;
  let totalCost = dinero({ amount: 0, currency });
  const totalPaid = new Map<number, Dinero<number>>();
  const totalOwing = new Map<number, Dinero<number>>();

  const renderContributors = allContributors.map((contributor, contributorIndex) => {
    let transactionIndex: number;
    let transactionType: TransactionType;
    let contributorClass = "";
    if (contributorIndex < contributorsLength) {
      transactionIndex = contributorIndex;
      transactionType = "existing";
    } else {
      contributorClass = "Grid-new";
      transactionIndex = contributorIndex - contributorsLength;
      transactionType = "new";
    }

    return (
      <div className={`Grid-cell Grid-numeric ${contributorClass}`} key={contributorIndex}>
        <Input
          defaultValue={contributor}
          disabled={props.loading}
          id={`contributor-${contributorIndex}`}
          onBlur={(e) => props.onContributorBlur(e, transactionType, transactionIndex)}
          required
        />
      </div>
    );
  });

  const renderItems = allItems.map((item, itemIndex) => {
    const allSplits = item.split?.concat(new Array(props.localContributors.length).fill(0)) ?? [];
    let transactionType: TransactionType;
    let transactionIndex: number;
    let rowClass = "";
    // let totalSplit = 0;
    if (typeof item.buyer !== "undefined" && typeof item.cost !== "undefined") {
      const buyerTotalPaid = totalPaid.get(item.buyer) || dinero({ amount: 0, currency });
      totalPaid.set(item.buyer, add(buyerTotalPaid, dinero({ amount: item.cost, currency })));
    }

    if (typeof item.cost !== "undefined") {
      totalCost = add(totalCost, dinero({ amount: item.cost, currency }));
    }

    if (itemIndex < itemsLength) {
      transactionIndex = itemIndex;
      transactionType = "existing";
    } else {
      rowClass = " Grid-new";
      transactionIndex = itemIndex - itemsLength;
      transactionType = "new";
    }

    const renderSplit = allSplits.map((split, splitIndex) => {
      // totalSplit += split;

      return splitIndex < props.contributors.length ? (
        <div className="Grid-cell Grid-numeric" key={splitIndex}>
          <Input
            defaultValue={split}
            disabled={props.loading}
            id={`split-${item.id}-${splitIndex}`}
            inputMode="numeric"
            numberFormat="integer"
            onBlur={(e) => props.onSplitBlur(e, transactionType, transactionIndex, splitIndex)}
            required
          />
        </div>
      ) : (
        <span className="Grid-description Grid-numeric" key={splitIndex}>
          {split}
        </span>
      );
    });

    if (item.cost && item.split) {
      const splitCosts = allocate(dinero({ amount: item.cost, currency }), item.split);
      splitCosts.forEach((split, splitIndex) => {
        const splitOwing = totalOwing.get(splitIndex) || dinero({ amount: 0, currency });
        totalOwing.set(splitIndex, add(splitOwing, split));
      });
    }

    return (
      <div className={`Grid-row ${rowClass}`} key={item.id}>
        <div className="Grid-cell">
          <Input
            defaultValue={item.name}
            disabled={props.loading}
            id={`name-${item.id}`}
            onBlur={(e) => props.onItemNameBlur(e, transactionType, transactionIndex)}
            required
          />
        </div>
        <div className="Grid-cell Grid-numeric">
          <Input
            defaultValue={item.cost}
            disabled={props.loading}
            id={`cost-${item.id}`}
            inputMode="numeric"
            numberFormat="currency"
            onBlur={(e) => props.onCostBlur(e, transactionType, transactionIndex)}
            required
          />
        </div>
        <div className="Grid-cell">
          <Select
            defaultValue={item.buyer}
            disabled={props.loading}
            id={`buyer-${item.id}`}
            onChange={(e) => {
              if (typeof props.onBuyerChange === "function") {
                props.onBuyerChange(e, transactionType, transactionIndex);
              }
            }}
            options={props.contributors}
          />
        </div>
        {renderSplit}
        {/* <span className="Grid-description Grid-numeric" id={`splitCost-${item.id}`}>
          {formatCurrency(
            typeof item.cost !== "undefined" && item.cost !== 0 && totalSplit > 0
              ? item.cost / totalSplit
              : 0
          )}
        </span> */}
      </div>
    );
  });

  const renderTotals = allContributors.map((_contributor, contributorIndex) => (
    <div className="Grid-total" key={contributorIndex}>
      <span className="Grid-description Grid-numeric">
        {formatCurrency(locale, toSnapshot(totalPaid.get(contributorIndex)!).amount)}
      </span>
      <span className="Grid-description Grid-numeric">
        {formatCurrency(locale, toSnapshot(totalOwing.get(contributorIndex)!).amount)}
      </span>
      <span className="Grid-description Grid-numeric">
        {formatCurrency(
          locale,
          toSnapshot(subtract(totalPaid.get(contributorIndex)!, totalOwing.get(contributorIndex)!))
            .amount
        )}
      </span>
    </div>
  ));
  renderTotals.unshift(
    <div className="Grid-total" key={-1}>
      <span className="Grid-description">Total Paid</span>
      <span className="Grid-description">Total Owing</span>
      <span className="Grid-description">Balance</span>
    </div>
  );

  return (
    <div className={`Grid-container ${props.className}`}>
      <div className="Grid-row">
        <span className="Grid-header">Item</span>
        <span className="Grid-header Grid-numeric">Cost</span>
        <span className="Grid-header">Buyer</span>
        {renderContributors}
      </div>
      {renderItems}
      <span className="Grid-description Grid-numeric Grid-total Grid-wide">
        {formatCurrency(locale, toSnapshot(totalCost).amount)}
      </span>
      {renderTotals}
    </div>
  );
})`
  ${({ contributors, loading, localContributors, theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    grid-template-columns: 100fr 1fr 1fr repeat(${
      contributors.length + localContributors.length
    }, 1fr);
    min-width: 768px;
    padding: ${theme.spacing(1, 2)};
    width: 100%;

    & .Grid-description {
      color: ${theme.palette.action.disabled};
      height: 100%;
      padding: ${theme.spacing(0.5, 2)};
      white-space: nowrap;
    }

    & .Grid-header {
      color: ${theme.palette.action.disabled};
      padding: ${theme.spacing(1, 2)};
      white-space: nowrap;
    }

    & .Grid-item {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-line;
    }

    & .Grid-numeric {
      text-align: right;
    }

    & .Grid-row {
      display: contents;

      ${
        !loading &&
        `
        &:hover, &:focus-within {
          & .Grid-cell > * {
            background: ${theme.palette.action.hover};

            &:hover, &:focus {
              background: ${theme.palette.action.selected};
            }
          }
        }
      `
      }

      &:not(:hover):not(:focus-within) {
        & .Grid-new.Grid-cell:not(:hover) > * {
          border-radius: ${theme.shape.borderRadius}px;
        }
      }

      & .Grid-cell {
        height: 100%;

        &:first-of-type > *:not(:focus-visible) {
          border-bottom-left-radius: ${theme.shape.borderRadius}px;
          border-top-left-radius: ${theme.shape.borderRadius}px;
        }

        &:last-of-type > *:not(:focus-visible) {
          border-bottom-right-radius: ${theme.shape.borderRadius}px;
          border-top-right-radius: ${theme.shape.borderRadius}px;
        }
      }

      &:not(:hover):not(:focus-within) .Grid-new.Grid-cell > *,
      &.Grid-new:not(:hover):not(:focus-within) .Grid-cell > * {
        background: ${alpha(theme.palette.secondary.main, theme.palette.action.hoverOpacity)};
      }
    }

    & .Grid-total {
      border-top: 2px solid ${theme.palette.divider};
      display: flex;
      flex-direction: column;
      grid-row: span 3;
      height: 100%;
      margin-top: ${theme.spacing(2)};
      padding-top: ${theme.spacing(1)};
    }

    & .Grid-wide {
      justify-content: center;
      grid-column: span 2;
      grid-row: span 3;
      text-align: center;
    }
  `}
`;
