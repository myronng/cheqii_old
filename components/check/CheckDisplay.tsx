import { Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { Input } from "components/check/Input";
import { Select } from "components/check/Select";
import { Check, Contributor, Item, BaseProps } from "declarations";
import { add, allocate, Dinero, dinero, subtract, toSnapshot } from "dinero.js";
import { useRouter } from "next/router";
import { ChangeEvent, FocusEvent } from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";

type TransactionType = "new" | "existing";

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  contributors?: NonNullable<Check["contributors"]>;
  items?: Item[];
  loading: boolean;
  localContributors?: Contributor[];
  localItems?: Item[];
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
  const contributors = props.contributors ?? [];
  const allContributors = props.localContributors
    ? contributors.concat(props.localContributors)
    : contributors;

  const items = props.items ?? [];
  const allItems = props.localItems ? items.concat(props.localItems) : items;
  const contributorsLength = contributors.length || 0;
  const itemsLength = items.length || 0;
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
    const allSplits = item.split?.concat(Array(props.localContributors?.length || 0).fill(0)) ?? [];
    let transactionType: TransactionType;
    let transactionIndex: number;
    let rowClass = "";
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

    const renderSplit = allSplits.map((split, splitIndex) =>
      splitIndex < (contributors.length || 0) ? (
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
      )
    );

    if (item.cost && item.split && item.split.some((split) => split > 0)) {
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
            options={contributors}
          />
        </div>
        {renderSplit}
      </div>
    );
  });

  const renderTotals = allContributors.map((_contributor, contributorIndex) => {
    const totalPaidDinero = totalPaid.get(contributorIndex) || dinero({ amount: 0, currency });
    const totalOwingDinero = totalOwing.get(contributorIndex) || dinero({ amount: 0, currency });
    return (
      <div className="Grid-total" key={contributorIndex}>
        <span className="Grid-description Grid-numeric">
          {formatCurrency(locale, toSnapshot(totalPaidDinero).amount)}
        </span>
        <span className="Grid-description Grid-numeric">
          {formatCurrency(locale, toSnapshot(totalOwingDinero).amount)}
        </span>
        <span className="Grid-description Grid-numeric">
          {formatCurrency(locale, toSnapshot(subtract(totalPaidDinero, totalOwingDinero)).amount)}
        </span>
      </div>
    );
  });
  renderTotals.unshift(
    <div className="Grid-total" key={-1}>
      <span className="Grid-description">{props.strings["totalPaid"]}</span>
      <span className="Grid-description">{props.strings["totalOwing"]}</span>
      <span className="Grid-description">{props.strings["balance"]}</span>
    </div>
  );

  return (
    <div className={`Grid-container ${props.className} ${props.loading ? "loading" : ""}`}>
      <div className="Grid-row">
        <span className="Grid-header">{props.strings["item"]}</span>
        <span className="Grid-header Grid-numeric">{props.strings["cost"]}</span>
        <span className="Grid-header">{props.strings["buyer"]}</span>
        {renderContributors}
      </div>
      {renderItems}
      <section className="Grid-description Grid-numeric Grid-total Grid-wide">
        <Typography component="span" variant="h3">
          {props.strings["checkTotal"]}
        </Typography>
        <Typography component="span" variant="h4">
          {formatCurrency(locale, toSnapshot(totalCost).amount)}
        </Typography>
      </section>
      {renderTotals}
    </div>
  );
})`
  ${({ contributors, localContributors, theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    grid-template-columns: 100fr 1fr 1fr ${
      contributors?.length || localContributors?.length
        ? `repeat(${(contributors?.length || 0) + (localContributors?.length || 0)}, 1fr)`
        : ""
    };
    min-width: 768px;
    padding: ${theme.spacing(1, 2)};
    width: 100%;

    &:not(.loading) {
      & .Grid-row {
        &:hover, & :focus-within {
          & .Grid-cell > * {
            background: ${theme.palette.action.hover};

            &:hover, &:focus {
              background: ${theme.palette.action.selected};
            }
          }
        }
      }
    }

    & .Grid-description {
      color: ${theme.palette.text.disabled};
      height: 100%;
      padding: ${theme.spacing(1, 2)};
      white-space: nowrap;
    }

    & .Grid-header {
      color: ${theme.palette.text.disabled};
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

      & .Grid-description {
        padding-bottom: ${theme.spacing(0.5)};
        padding-top: ${theme.spacing(0.5)};
      }
    }

    & .Grid-wide {
      justify-content: center;
      grid-column: span 2;
      grid-row: span 3;
      text-align: center;
    }
  `}
`;
