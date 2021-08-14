import { styled } from "@material-ui/core/styles";
import { Select } from "components/check/Select";
import { Input } from "components/check/Input";
import { Check, StyledProps } from "declarations";
import { FocusEvent } from "react";

export type CheckDisplayProps = StyledProps & {
  contributors: NonNullable<Check["contributors"]>;
  items: NonNullable<Check["items"]>;
  onBuyerChange: (buyerIndex: number, itemIndex: number) => void;
  onContributorBlur: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onCostBlur: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onItemNameBlur: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onSplitBlur: (event: FocusEvent<HTMLInputElement>, itemIndex: number, splitIndex: number) => void;
};

export const CheckDisplay = styled((props: CheckDisplayProps) => {
  return (
    <>
      <div className={`Grid-container ${props.className}`}>
        <div className="Grid-header Grid-headerText">Item</div>
        <div className="Grid-header Grid-headerText Grid-numeric">Cost</div>
        <div className="Grid-header Grid-headerButton Grid-headerText">Buyer</div>
        {props.contributors.map((contributor, contributorIndex) => (
          <div className="Grid-numeric" key={contributorIndex}>
            <Input
              defaultValue={contributor}
              id={`contributor-${contributorIndex}`}
              onBlur={(e) => props.onContributorBlur(e, contributorIndex)}
              required
            />
          </div>
        ))}
        {props.items.map((item, itemIndex) => (
          <div className="Grid-row" key={itemIndex}>
            <div className="Grid-cell">
              <Input
                defaultValue={item.name}
                id={`name-${itemIndex}`}
                onBlur={(e) => props.onItemNameBlur(e, itemIndex)}
                required
              />
            </div>
            <div className="Grid-cell Grid-numeric">
              <Input
                defaultValue={item.cost}
                id={`cost-${itemIndex}`}
                inputMode="numeric"
                numberFormat={{
                  currency: "CAD",
                  currencyDisplay: "narrowSymbol",
                  style: "currency",
                }}
                onBlur={(e) => props.onCostBlur(e, itemIndex)}
                required
              />
            </div>
            <div className="Grid-cell">
              <Select
                defaultValue={item.buyer}
                id={`buyer-${itemIndex}`}
                onChange={(buyerIndex) => {
                  if (typeof props.onBuyerChange === "function") {
                    props.onBuyerChange(buyerIndex, itemIndex);
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
                  numberFormat={{
                    maximumFractionDigits: 0,
                    style: "decimal",
                  }}
                  onBlur={(e) => props.onSplitBlur(e, itemIndex, splitIndex)}
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

    & .Grid-numeric {
      text-align: right;
    }

    & .Grid-row {
      display: contents;

      &:hover {
        & .Grid-cell > * {
          background: ${theme.palette.action.hover};

          &:hover {
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
