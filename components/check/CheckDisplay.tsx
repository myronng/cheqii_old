import { alpha, styled } from "@material-ui/core/styles";
import { Select } from "components/check/Select";
import { Input } from "components/check/Input";
import { Check, Contributor, Item, StyledProps } from "declarations";
import { ChangeEvent, FocusEvent } from "react";
import { useCurrencyFormat } from "services/formatter";

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
  // const formatCurrency = useCurrencyFormat();
  const allContributors = props.contributors.concat(props.localContributors);
  const allItems = props.items.concat(props.localItems);
  const contributorsLength = props.contributors.length;
  const itemsLength = props.items.length;
  let totalCost = 0;

  return (
    <div className={`Grid-container ${props.className}`}>
      <div className="Grid-row">
        <span className="Grid-header">Item</span>
        <span className="Grid-header Grid-numeric">Cost</span>
        <span className="Grid-header">Buyer</span>
        {allContributors.map((contributor, contributorIndex) => {
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
        })}
      </div>
      {allItems.map((item, itemIndex) => {
        const allSplits =
          item.split?.concat(new Array(props.localContributors.length).fill(0)) || [];
        let transactionType: TransactionType;
        let transactionIndex: number;
        let rowClass = "";
        let totalSplit = 0;

        if (typeof item.cost !== "undefined") {
          totalCost += item.cost;
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
          totalSplit += split;

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
      })}
      {console.log(totalCost)}
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

      & .Grid-description {
        color: ${theme.palette.action.disabled};
        height: 100%;
        padding: ${theme.spacing(1, 2)};
      }

      &:not(:hover):not(:focus-within) .Grid-new.Grid-cell > *,
      &.Grid-new:not(:hover):not(:focus-within) .Grid-cell > * {
        background: ${alpha(theme.palette.secondary.main, theme.palette.action.hoverOpacity)};
      }
    }
  `}
`;
