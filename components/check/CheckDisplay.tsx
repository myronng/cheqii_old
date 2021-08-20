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
  const allItems = props.items.concat(props.localItems);
  const localItemsIndex = props.items.length;
  let totalCost = 0;

  return (
    <div className={`Grid-container ${props.className}`}>
      <div className="Grid-row">
        <span
          className="Grid-header"
          // style={{ gridArea: "1 / 1 / 2 / 2" }}
        >
          Item
        </span>
        <span
          className="Grid-header Grid-numeric"
          // style={{ gridArea: "1 / 2 / 2 / 3" }}
        >
          Cost
        </span>
        <span
          className="Grid-header"
          // style={{ gridArea: "1 / 3 / 2 / 4" }}
        >
          Buyer
        </span>
        {props.contributors.map((contributor, contributorIndex) => (
          <div
            className="Grid-cell Grid-numeric"
            key={contributorIndex}
            // style={{
            //   gridArea: `1 / ${contributorIndex + 4} / 2 / ${contributorIndex + 5}`,
            // }}
          >
            <Input
              defaultValue={contributor}
              id={`contributor-${contributorIndex}`}
              onBlur={(e) => props.onContributorBlur(e, "existing", contributorIndex)}
              required
            />
          </div>
        ))}
        {props.localContributors.map((localContributor, localContributorIndex) => {
          // const columnPosition = props.contributors.length + localContributorIndex;
          return (
            <div
              className="Grid-cell Grid-numeric"
              key={localContributorIndex}
              // style={{ gridArea: `1 / ${columnPosition + 4} / 2 / ${columnPosition + 5}` }}
            >
              <Input
                defaultValue={localContributor}
                id={`contributor-${localContributorIndex}`}
                onBlur={(e) => props.onContributorBlur(e, "new", localContributorIndex)}
                required
              />
            </div>
          );
        })}
      </div>
      {allItems.map((item, itemIndex) => {
        let transactionType: TransactionType;
        let transactionIndex: number;
        let rowClass: string;
        let totalSplit = 0;
        // const rowStart = itemIndex + 2;
        // const rowEnd = itemIndex + 3;

        if (typeof item.cost !== "undefined") {
          totalCost += item.cost;
        }

        if (itemIndex < localItemsIndex) {
          rowClass = "Grid-row";
          transactionIndex = itemIndex;
          transactionType = "existing";
        } else {
          rowClass = "Grid-row Grid-new";
          transactionIndex = itemIndex - localItemsIndex;
          transactionType = "new";
        }

        const renderSplit = item.split?.map((split, splitIndex) => {
          totalSplit += split;

          return (
            <div
              className="Grid-cell Grid-numeric"
              key={splitIndex}
              // style={{
              //   gridArea: `${rowStart} / ${splitIndex + 4} / ${rowEnd} / ${splitIndex + 5}`,
              // }}
            >
              <Input
                defaultValue={split}
                id={`split-${item.id}-${splitIndex}`}
                inputMode="numeric"
                numberFormat="integer"
                onBlur={(e) => props.onSplitBlur(e, transactionType, transactionIndex, splitIndex)}
                required
              />
            </div>
          );
        });
        return (
          <div className={rowClass} key={item.id}>
            <div
              className="Grid-cell"
              // style={{
              //   gridArea: `${rowStart} / 1 / ${rowEnd} / 2`,
              // }}
            >
              <Input
                defaultValue={item.name}
                id={`name-${item.id}`}
                onBlur={(e) => props.onItemNameBlur(e, transactionType, transactionIndex)}
                required
              />
            </div>
            <div
              className="Grid-cell Grid-numeric"
              // style={{
              //   gridArea: `${rowStart} / 2 / ${rowEnd} / 3`,
              // }}
            >
              <Input
                defaultValue={item.cost}
                id={`cost-${item.id}`}
                inputMode="numeric"
                numberFormat="currency"
                onBlur={(e) => props.onCostBlur(e, transactionType, transactionIndex)}
                required
              />
            </div>
            <div
              className="Grid-cell"
              // style={{
              //   gridArea: `${rowStart} / 3 / ${rowEnd} / 4`,
              // }}
            >
              <Select
                defaultValue={item.buyer}
                id={`buyer-${item.id}`}
                onChange={(e) => {
                  if (typeof props.onBuyerChange === "function") {
                    props.onBuyerChange(e, transactionType, transactionIndex);
                  }
                }}
                options={props.contributors}
                required
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
  ${({ contributors, theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    grid-template-columns: 100fr 1fr 1fr repeat(${contributors.length}, 1fr);
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

    & .Grid-new:not(:hover) .Grid-cell > * {
      background: ${alpha(theme.palette.secondary.main, theme.palette.action.hoverOpacity)};
    }

    & .Grid-numeric {
      text-align: right;
    }

    & .Grid-row {
      display: contents;

      &:hover, &:focus-within {
        & .Grid-cell > * {
          background: ${theme.palette.action.hover};

          &:hover, &:focus {
            background: ${theme.palette.action.selected};
          }
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

        & > * {
          transition: ${theme.transitions.create("border-radius", {
            duration: theme.transitions.duration.shorter,
            easing: theme.transitions.easing.easeInOut,
          })};
        }
      }

      & .Grid-description {
        color: ${theme.palette.action.disabled};
        height: 100%;
        padding: ${theme.spacing(1, 2)};
      }
    }
  `}
`;
