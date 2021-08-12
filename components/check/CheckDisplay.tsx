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
  const gridContributers = props.contributors.map((contributor, index) => (
    <Input className="Grid-numeric" key={index} defaultValue={contributor} />
  ));

  return (
    <>
      <div className={`Grid-container ${props.className}`}>
        <div className="Grid-header">Item</div>
        <div className="Grid-header Grid-numeric">Cost</div>
        <div className="Grid-header Grid-buttonHeader">Buyer</div>
        {gridContributers}
        {props.items.map((item, itemIndex) => (
          <Fragment key={itemIndex}>
            <Input className="Grid-alphabetic" defaultValue={item.name} />
            <Input
              className="Grid-numeric"
              defaultValue={item.cost}
              inputMode="numeric"
              numberFormat={{
                currency: "CAD",
                currencyDisplay: "narrowSymbol",
                style: "currency",
              }}
            />
            <Select
              className="Grid-alphabetic"
              defaultValue={item.buyer}
              options={props.contributors}
            />
            {item.split?.map((contribution, contributionIndex) => (
              <Input
                className="Grid-numeric"
                defaultValue={contribution}
                inputMode="numeric"
                key={contributionIndex}
                numberFormat={{
                  maximumFractionDigits: 0,
                  style: "decimal",
                }}
              />
            ))}
          </Fragment>
        ))}
      </div>
    </>
  );
})`
  ${({ contributors = [], theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    gap: ${theme.spacing(1.5, 4)};
    grid-template-columns: 1fr auto auto repeat(${contributors.length}, auto);
    min-width: 768px;
    padding: ${theme.spacing(2, 4)};
    width: 100%;

    & .Grid-alphabetic {
    }

    & .Grid-buttonHeader {
      margin: ${theme.spacing(0, 1)};
    }

    & .Grid-header {
      color: ${theme.palette.action.disabled};
    }

    & .Grid-numeric {
      margin-left: auto;
    }

    & .Grid-item {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-line;
    }

  `}
`;
