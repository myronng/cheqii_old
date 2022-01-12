import { styled } from "@mui/material/styles";
import { Input } from "components/check/Input";
import { Select } from "components/check/Select";
import { BaseProps, Check, Item, Styles } from "declarations";
import { add, allocate, Dinero, dinero, subtract, toSnapshot } from "dinero.js";
import { useRouter } from "next/router";
import { ChangeEvent, ChangeEventHandler, FocusEvent, FocusEventHandler } from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";

interface CheckDisplayStyles extends Styles {
  contributors: CheckDisplayProps["contributors"];
}

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  contributors?: NonNullable<Check["contributors"]>;
  items?: Item[];
  loading: boolean;
  onBuyerChange: (event: ChangeEvent<HTMLSelectElement>, index: number) => void;
  onContributorBlur: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onCostBlur: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onItemNameBlur: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onSplitBlur: (event: FocusEvent<HTMLInputElement>, itemIndex: number, splitIndex: number) => void;
};

export const CheckDisplay = styled((props: CheckDisplayProps) => {
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale!;
  const currency = getCurrencyType(locale);
  const contributors = props.contributors ?? [];

  const items = props.items ?? [];
  let totalCost = dinero({ amount: 0, currency });
  const totalPaid = new Map<number, Dinero<number>>();
  const totalOwing = new Map<number, Dinero<number>>();

  const renderContributors = contributors.map((contributor, contributorIndex) => {
    const handleContributorBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      props.onContributorBlur(e, contributorIndex);
    };

    return (
      <div className={`Grid-cell Grid-numeric`} key={contributorIndex}>
        <Input
          defaultValue={contributor}
          disabled={props.loading}
          id={`contributor-${contributorIndex}`}
          onBlur={handleContributorBlur}
          required
        />
      </div>
    );
  });

  const renderItems = items.map((item, itemIndex) => {
    if (typeof item.buyer !== "undefined" && typeof item.cost !== "undefined") {
      const buyerTotalPaid = totalPaid.get(item.buyer) || dinero({ amount: 0, currency });
      totalPaid.set(item.buyer, add(buyerTotalPaid, dinero({ amount: item.cost, currency })));
    }

    if (typeof item.cost !== "undefined") {
      totalCost = add(totalCost, dinero({ amount: item.cost, currency }));
    }

    const splits = item.split ?? [];
    const renderSplit = splits.map((split, splitIndex) => {
      const handleSplitBlur: FocusEventHandler<HTMLInputElement> = (e) => {
        props.onSplitBlur(e, itemIndex, splitIndex);
      };

      return splitIndex < (contributors.length || 0) ? (
        <div className="Grid-cell Grid-numeric" key={splitIndex}>
          <Input
            defaultValue={split}
            disabled={props.loading}
            id={`split-${item.id}-${splitIndex}`}
            inputMode="numeric"
            numberFormat="integer"
            onBlur={handleSplitBlur}
            required
          />
        </div>
      ) : (
        <span className="Grid-description Grid-numeric" key={splitIndex}>
          {split}
        </span>
      );
    });

    if (item.cost && item.split && item.split.some((split) => split > 0)) {
      const splitCosts = allocate(dinero({ amount: item.cost, currency }), item.split);
      splitCosts.forEach((split, splitIndex) => {
        const splitOwing = totalOwing.get(splitIndex) || dinero({ amount: 0, currency });
        totalOwing.set(splitIndex, add(splitOwing, split));
      });
    }

    const handleBuyerChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
      props.onBuyerChange(e, itemIndex);
    };

    const handleCostBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      props.onCostBlur(e, itemIndex);
    };

    const handleItemNameBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      props.onItemNameBlur(e, itemIndex);
    };

    return (
      <div className={`Grid-row`} key={item.id}>
        <div className="Grid-cell">
          <Input
            defaultValue={item.name}
            disabled={props.loading}
            id={`name-${item.id}`}
            onBlur={handleItemNameBlur}
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
            onBlur={handleCostBlur}
            required
          />
        </div>
        <div className="Grid-cell">
          <Select
            defaultValue={item.buyer}
            disabled={props.loading}
            id={`buyer-${item.id}`}
            onChange={handleBuyerChange}
            options={contributors}
          />
        </div>
        {renderSplit}
      </div>
    );
  });

  const renderTotals = contributors.map((_contributor, contributorIndex) => {
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
      <section className="Grid-description Grid-numeric Grid-total CheckTotal-root">
        <span className="CheckTotal-header">{props.strings["checkTotal"]}</span>
        <span className="CheckTotal-value">
          {formatCurrency(locale, toSnapshot(totalCost).amount)}
        </span>
      </section>
      {renderTotals}
    </div>
  );
})`
  ${({ contributors, theme }: CheckDisplayStyles) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    // Item column can't rely on max-content alone since <input> doesn't fit to its content
    grid-template-columns: 1fr min-content min-content ${
      contributors?.length ? `repeat(${contributors.length}, min-content)` : ""
    };
    min-width: 100%;
    padding: ${theme.spacing(1, 2)};

    &:not(.loading) {
      & .Grid-row {
        &:hover, &:focus-within {
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

    & .CheckTotal-root {
      font-family: Fira Code;
      grid-column: span 2;
      grid-row: span 3;
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
