import { alpha, styled } from "@material-ui/core/styles";
// import { Select } from "components/check/Menu";
import { Select } from "components/check/Select";
import { Input } from "components/check/Input";
import { Check, Contributor, Item, StyledProps } from "declarations";
import { ChangeEvent, FocusEvent } from "react";

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
  return (
    <>
      <div className={`Grid-container ${props.className}`}>
        <div className="Grid-row">
          <span className="Grid-header Grid-headerText">Item</span>
          <span className="Grid-header Grid-headerText Grid-numeric">Cost</span>
          <span className="Grid-header Grid-headerButton Grid-headerText">Buyer</span>
          {props.contributors.map((contributor, contributorIndex) => (
            <div className="Grid-cell Grid-numeric" key={contributorIndex}>
              <Input
                defaultValue={contributor}
                id={`contributor-${contributorIndex}`}
                onBlur={(e) => props.onContributorBlur(e, "existing", contributorIndex)}
                required
              />
            </div>
          ))}
          {props.localContributors.map((localContributor, localContributorIndex) => (
            <div className="Grid-cell Grid-numeric" key={localContributorIndex}>
              <Input
                defaultValue={localContributor}
                id={`contributor-${localContributorIndex}`}
                onBlur={(e) => props.onContributorBlur(e, "new", localContributorIndex)}
                required
              />
            </div>
          ))}
        </div>
        {props.items.map((item, itemIndex) => (
          <div className="Grid-row" key={itemIndex}>
            <div className="Grid-cell">
              <Input
                defaultValue={item.name}
                id={`name-${itemIndex}`}
                onBlur={(e) => props.onItemNameBlur(e, "existing", itemIndex)}
                required
              />
            </div>
            <div className="Grid-cell Grid-numeric">
              <Input
                defaultValue={item.cost}
                id={`cost-${itemIndex}`}
                inputMode="numeric"
                numberFormat="currency"
                onBlur={(e) => props.onCostBlur(e, "existing", itemIndex)}
                required
              />
            </div>
            <div className="Grid-cell">
              <Select
                defaultValue={item.buyer}
                id={`buyer-${itemIndex}`}
                onChange={(e) => {
                  if (typeof props.onBuyerChange === "function") {
                    props.onBuyerChange(e, "existing", itemIndex);
                  }
                }}
                options={props.contributors}
              />
            </div>
            {item.split?.map((split, splitIndex) => (
              <div className="Grid-cell Grid-numeric" key={splitIndex}>
                <Input
                  defaultValue={split}
                  id={`split-${itemIndex}-${splitIndex}`}
                  inputMode="numeric"
                  numberFormat="integer"
                  onBlur={(e) => props.onSplitBlur(e, "existing", itemIndex, splitIndex)}
                  pattern="\p{N}*"
                  required
                />
              </div>
            ))}
          </div>
        ))}
        {props.localItems.map((localItem, localItemIndex) => (
          <div className="Grid-row Grid-new" key={localItemIndex}>
            <div className="Grid-cell">
              <Input
                defaultValue={localItem.name}
                id={`local-name-${localItemIndex}`}
                onBlur={(e) => props.onItemNameBlur(e, "new", localItemIndex)}
                required
              />
            </div>
            <div className="Grid-cell Grid-numeric">
              <Input
                defaultValue={localItem.cost}
                id={`local-cost-${localItemIndex}`}
                inputMode="numeric"
                numberFormat="currency"
                onBlur={(e) => props.onCostBlur(e, "new", localItemIndex)}
                required
              />
            </div>
            <div className="Grid-cell">
              <Select
                defaultValue={localItem.buyer}
                id={`local-buyer-${localItemIndex}`}
                onChange={(e) => {
                  if (typeof props.onBuyerChange === "function") {
                    props.onBuyerChange(e, "new", localItemIndex);
                  }
                }}
                options={props.contributors}
              />
            </div>
            {localItem.split?.map((localSplit, localSplitIndex) => (
              <div className="Grid-cell Grid-numeric" key={localSplitIndex}>
                <Input
                  defaultValue={localSplit}
                  id={`local-split-${localItemIndex}-${localSplitIndex}`}
                  inputMode="numeric"
                  numberFormat="integer"
                  onBlur={(e) => props.onSplitBlur(e, "new", localItemIndex, localSplitIndex)}
                  pattern="\p{N}*"
                  required
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
})`
  ${({ contributors = [], theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    grid-template-columns: 100fr 1fr 1fr repeat(${contributors.length}, 1fr);
    min-width: 768px;
    padding: ${theme.spacing(1, 2)};
    width: 100%;

    & .Grid-header {
      padding: ${theme.spacing(1, 2)};
    }

    & .Grid-headerButton {
      justify-self: center;
    }

    & .Grid-headerText {
      color: ${theme.palette.action.disabled};
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
    }
  `}
`;
