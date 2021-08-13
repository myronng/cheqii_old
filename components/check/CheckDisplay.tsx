import { styled } from "@material-ui/core/styles";
import { Select } from "components/check/Select";
import { Input } from "components/check/Input";
import { Check, StyledProps } from "declarations";
import { Fragment } from "react";

export type CheckDisplayProps = StyledProps & {
  contributors: NonNullable<Check["contributors"]>;
  items: NonNullable<Check["items"]>;
};

export const CheckDisplay = styled((props: CheckDisplayProps) => {
  return (
    <>
      <div className={`Grid-container ${props.className}`}>
        <div className="Grid-header Grid-headerText">Item</div>
        <div className="Grid-header Grid-headerText Grid-numeric">Cost</div>
        <div className="Grid-header Grid-headerButton Grid-headerText">Buyer</div>
        {props.contributors.map((contributor, index) => (
          <div className="Grid-numeric" key={index}>
            <Input defaultValue={contributor} />
          </div>
        ))}
        {props.items.map((item, itemIndex) => (
          <div className="Grid-row" key={itemIndex}>
            <div className="Grid-cell">
              <Input defaultValue={item.name} />
            </div>
            <div className="Grid-cell Grid-numeric">
              <Input
                defaultValue={item.cost}
                inputMode="numeric"
                numberFormat={{
                  currency: "CAD",
                  currencyDisplay: "narrowSymbol",
                  style: "currency",
                }}
              />
            </div>
            <div className="Grid-cell">
              <Select defaultValue={item.buyer} options={props.contributors} />
            </div>
            {item.split?.map((contribution, contributionIndex) => (
              <div className="Grid-cell Grid-numeric" key={contributionIndex}>
                <Input
                  defaultValue={contribution}
                  inputMode="numeric"
                  numberFormat={{
                    maximumFractionDigits: 0,
                    style: "decimal",
                  }}
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
