import { styled } from "@material-ui/core/styles";
import { Check, StyledProps } from "declarations";
import { useRouter } from "next/router";
import { Fragment } from "react";

export type CheckDisplayProps = StyledProps & {
  contributors: NonNullable<Check["contributors"]>;
  items: NonNullable<Check["items"]>;
};

export const CheckDisplay = styled((props: CheckDisplayProps) => {
  const router = useRouter();
  const formatter = new Intl.NumberFormat(router.locales, {
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
    style: "currency",
  });

  return (
    <div className={`Grid-container ${props.className}`}>
      <div className="Grid-header">Item</div>
      <div className="Grid-header Grid-numeric">Cost</div>
      <div className="Grid-header">Buyer</div>
      {props.contributors.map((contributor, index) => (
        <div className="Grid-contributor" key={contributor + index}>
          {contributor}
        </div>
      ))}
      {props.items.map((item, index) => (
        <Fragment key={index}>
          <div className="Grid-item">{item.name}</div>
          <div className="Grid-numeric">{formatter.format(item.cost || 0)}</div>
          <div className="Grid-buyer">
            {typeof item.buyer !== "undefined" ? props.contributors[item.buyer] : ""}
          </div>
          {item.split?.map((contribution, index) => (
            <div className="Grid-contributor" key={index}>
              {contribution}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
})`
  ${({ contributors = [], theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    gap: ${theme.spacing(2, 4)};
    grid-template-columns: minmax(0, 1fr) auto auto repeat(${contributors.length}, auto);
    min-width: 768px;
    padding: ${theme.spacing(2, 4)};
    width: 100%;

    & .Grid-header {
      color: ${theme.palette.action.disabled};
    }

    & .Grid-numeric {
      text-align: right;
    }

    & .Grid-item {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-line;
    }

    & .Grid-contributor {
      text-align: right;
    }
  `}
`;
