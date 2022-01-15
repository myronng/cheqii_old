import { styled } from "@mui/material/styles";
import { InputMenu } from "components/check/InputMenu";
import { SelectMenu } from "components/check/SelectMenu";
import { BaseProps, Check, Item } from "declarations";
import { add, allocate, Dinero, dinero, subtract, toSnapshot } from "dinero.js";
import { useRouter } from "next/router";
import {
  ChangeEvent,
  ChangeEventHandler,
  FocusEvent,
  FocusEventHandler,
  Fragment,
  MouseEvent,
} from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  contributors?: NonNullable<Check["contributors"]>;
  items?: Item[];
  loading: boolean;
  onBuyerChange: (event: ChangeEvent<HTMLSelectElement>, index: number) => void;
  onContributorBlur: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onContributorDelete: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
  onCostBlur: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onItemDelete: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
  onItemNameBlur: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onSplitBlur: (event: FocusEvent<HTMLInputElement>, itemIndex: number, splitIndex: number) => void;
};

export type Column = number | null;

export type Row = number | null;

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
    const contributorId = `contributor-${contributorIndex}`;
    const column = contributorIndex + 3;
    const row = 0;

    const handleContributorBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      props.onContributorBlur(e, contributorIndex);
    };

    return (
      <InputMenu
        actions={[
          {
            color: "error",
            id: "deleteColumn",
            label: props.strings["deleteColumn"],
            onClick: (e) => {
              props.onContributorDelete(e, contributorIndex);
            },
          },
        ]}
        className="Grid-cell Grid-numeric"
        InputProps={{
          column,
          defaultValue: contributor,
          disabled: props.loading,
          id: contributorId,
          onBlur: handleContributorBlur,
          required: true,
          row,
        }}
        key={contributorIndex}
      />
    );
  });

  const renderItems = items.map((item, itemIndex) => {
    const row = itemIndex + 1;
    if (typeof item.buyer !== "undefined" && typeof item.cost !== "undefined") {
      const buyerTotalPaid = totalPaid.get(item.buyer) || dinero({ amount: 0, currency });
      totalPaid.set(item.buyer, add(buyerTotalPaid, dinero({ amount: item.cost, currency })));
    }

    if (typeof item.cost !== "undefined") {
      totalCost = add(totalCost, dinero({ amount: item.cost, currency }));
    }

    const splits = item.split ?? [];
    const renderSplit = splits.map((split, splitIndex) => {
      const column = splitIndex + 3;
      const splitId = `split-${item.id}-${splitIndex}`;

      const handleSplitBlur: FocusEventHandler<HTMLInputElement> = (e) => {
        props.onSplitBlur(e, itemIndex, splitIndex);
      };

      return (
        <InputMenu
          actions={[
            {
              color: "error",
              id: "deleteRow",
              label: props.strings["deleteRow"],
              onClick: (e) => {
                props.onItemDelete(e, itemIndex);
              },
            },
            {
              color: "error",
              id: "deleteColumn",
              label: props.strings["deleteColumn"],
              onClick: (e) => {
                props.onContributorDelete(e, splitIndex);
              },
            },
          ]}
          className="Grid-cell Grid-numeric"
          InputProps={{
            column,
            defaultValue: split,
            disabled: props.loading,
            id: splitId,
            numberFormat: "integer",
            onBlur: handleSplitBlur,
            required: true,
            row,
          }}
          key={`${splitIndex}-${split}`} // Use value and index for re-rendering contributor deletes properly
        />
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
      <Fragment key={item.id}>
        <InputMenu
          actions={[
            {
              color: "error",
              id: "deleteRow",
              label: props.strings["deleteRow"],
              onClick: (e) => {
                props.onItemDelete(e, itemIndex);
              },
            },
          ]}
          className="Grid-cell"
          InputProps={{
            column: 0,
            defaultValue: item.name,
            disabled: props.loading,
            id: `name-${item.id}`,
            onBlur: handleItemNameBlur,
            required: true,
            row,
          }}
        />
        <InputMenu
          actions={[
            {
              color: "error",
              id: "deleteRow",
              label: props.strings["deleteRow"],
              onClick: (e) => {
                props.onItemDelete(e, itemIndex);
              },
            },
          ]}
          className="Grid-cell Grid-numeric"
          InputProps={{
            column: 1,
            defaultValue: item.cost,
            disabled: props.loading,
            id: `cost-${item.id}`,
            numberFormat: "currency",
            onBlur: handleCostBlur,
            required: true,
            row,
          }}
        />
        <SelectMenu
          actions={[
            {
              color: "error",
              id: "deleteRow",
              label: props.strings["deleteRow"],
              onClick: (e) => {
                props.onItemDelete(e, itemIndex);
              },
            },
          ]}
          className="Grid-cell"
          SelectProps={{
            column: 2,
            defaultValue: item.buyer,
            disabled: props.loading,
            id: `buyer-${item.id}`,
            onChange: handleBuyerChange,
            options: contributors,
            required: true,
            row,
          }}
        />
        {renderSplit}
      </Fragment>
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
    <div className={`Grid-container ${props.className}`}>
      <section className="Grid-data">
        <span className="Grid-header">{props.strings["item"]}</span>
        <span className="Grid-header Grid-numeric">{props.strings["cost"]}</span>
        <span className="Grid-header">{props.strings["buyer"]}</span>
        {renderContributors}
        {renderItems}
        {/* <FloatingMenu
          PopperProps={{
            anchorEl: focus?.selected,
            open: Boolean(focus.selected) && Boolean(floatingMenu),
          }}
        >
          {floatingMenu?.map((action) => (
            <Button key={action.id} {...action.ButtonProps}>
              {props.strings[action.id]}
            </Button>
          ))}
        </FloatingMenu> */}
      </section>
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
  ${({ contributors, theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    // Item column can't rely on max-content alone since <input> doesn't fit to its content
    grid-template-columns: 1fr min-content min-content ${
      contributors?.length ? `repeat(${contributors.length}, min-content)` : ""
    };
    min-width: 100%;
    padding: ${theme.spacing(1, 2)};

    & .Grid-cell {
      height: 100%;
    }

    & .Grid-data {
      display: contents;
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
