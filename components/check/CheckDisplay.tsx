import { styled } from "@mui/material/styles";
import { FloatingMenu, FloatingMenuHandle } from "components/check/FloatingMenu";
import { Input } from "components/check/Input";
import { Select } from "components/check/Select";
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
  useRef,
} from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { parseNumericValue } from "services/parser";

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  contributors?: NonNullable<Check["contributors"]>;
  items?: Item[];
  loading: boolean;
  onBuyerChange?: (event: ChangeEvent<HTMLSelectElement>, index: number) => void;
  onContributorBlur?: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onContributorDelete?: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
  onCostBlur?: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onItemDelete?: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
  onNameBlur?: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onSplitBlur?: (
    event: FocusEvent<HTMLInputElement>,
    itemIndex: number,
    splitIndex: number
  ) => void;
  userAccess: number;
  writeAccess: boolean;
};

export type Column = number | null;

export type Row = number | null;

const togglePeripheralClasses = (
  element: HTMLElement,
  column: Column,
  row: Row,
  active?: boolean
) => {
  const container = element.closest(".Grid-data");
  if (container !== null) {
    const columnPeripherals = container.querySelectorAll(`[data-column="${column}"]`);
    columnPeripherals.forEach((columnNode) => {
      if (columnNode instanceof HTMLElement && columnNode.dataset.row !== row?.toString()) {
        columnNode.classList.toggle("peripheral", active);
      }
    });
    const rowPeripherals = container.querySelectorAll(`[data-row="${row}"]`);
    rowPeripherals.forEach((rowNode) => {
      if (rowNode instanceof HTMLElement && rowNode.dataset.column !== column?.toString()) {
        rowNode.classList.toggle("peripheral", active);
      }
    });
    element.classList.toggle("selected", active);
  }
};

export const CheckDisplay = styled((props: CheckDisplayProps) => {
  const router = useRouter();
  const floatingMenuRef = useRef<FloatingMenuHandle>(null);
  const lastSelectedCell = useRef<HTMLElement | null>(null);
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
      if (props.writeAccess && typeof props.onContributorBlur === "function") {
        props.onContributorBlur(e, contributorIndex);
      }
    };

    const handleContributorFocus: FocusEventHandler<HTMLInputElement> = (e) => {
      if (props.writeAccess) {
        const floatingMenu = floatingMenuRef.current;
        if (floatingMenu) {
          floatingMenu.setOptions([
            {
              color: "error",
              id: "deleteColumn",
              label: props.strings["deleteColumn"],
              onClick: (e) => {
                if (typeof props.onContributorDelete === "function") {
                  floatingMenu.setAnchor(null);
                  props.onContributorDelete(e, contributorIndex);
                }
              },
            },
          ]);
        }
      }
    };

    return (
      <Input
        className="Grid-cell Grid-numeric"
        column={column}
        defaultValue={contributor}
        disabled={props.loading || !props.writeAccess}
        id={contributorId}
        key={contributorIndex}
        onBlur={handleContributorBlur}
        onFocus={handleContributorFocus}
        row={row}
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
        if (props.writeAccess && typeof props.onSplitBlur === "function") {
          props.onSplitBlur(e, itemIndex, splitIndex);
        }
      };

      const handleSplitFocus: FocusEventHandler<HTMLInputElement> = (e) => {
        if (props.writeAccess) {
          const floatingMenu = floatingMenuRef.current;
          if (floatingMenu) {
            floatingMenu.setOptions([
              {
                color: "error",
                id: "deleteRow",
                label: props.strings["deleteRow"],
                onClick: (e) => {
                  floatingMenu.setAnchor(null);
                  if (typeof props.onItemDelete === "function") {
                    props.onItemDelete(e, itemIndex);
                  }
                },
              },
              {
                color: "error",
                id: "deleteColumn",
                label: props.strings["deleteColumn"],
                onClick: (e) => {
                  floatingMenu.setAnchor(null);
                  if (typeof props.onContributorDelete === "function") {
                    props.onContributorDelete(e, splitIndex);
                  }
                },
              },
            ]);
          }
        }
      };

      return (
        <Input
          className="Grid-cell Grid-numeric"
          column={column}
          defaultValue={split}
          disabled={props.loading || !props.writeAccess}
          id={splitId}
          key={`${splitIndex}-${split}`} // Use value and index for re-rendering contributor deletes properly
          numberFormat="integer"
          onBlur={handleSplitBlur}
          onFocus={handleSplitFocus}
          row={row}
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
      if (props.writeAccess && typeof props.onBuyerChange === "function") {
        props.onBuyerChange(e, itemIndex);
      }
    };

    const handleCostBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      if (props.writeAccess && typeof props.onCostBlur === "function") {
        props.onCostBlur(e, itemIndex);
      }
    };

    const handleNameBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      if (props.writeAccess && typeof props.onNameBlur === "function") {
        props.onNameBlur(e, itemIndex);
      }
    };

    const handleItemFocus: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
      if (props.writeAccess) {
        const floatingMenu = floatingMenuRef.current;
        if (floatingMenu) {
          floatingMenu.setOptions([
            {
              color: "error",
              id: "deleteRow",
              label: props.strings["deleteRow"],
              onClick: (e) => {
                floatingMenu.setAnchor(null);
                if (typeof props.onItemDelete === "function") {
                  props.onItemDelete(e, itemIndex);
                }
              },
            },
          ]);
        }
      }
    };

    return (
      <Fragment key={item.id}>
        <Input
          className="Grid-cell"
          column={0}
          defaultValue={item.name}
          disabled={props.loading || !props.writeAccess}
          id={`name-${item.id}`}
          onBlur={handleNameBlur}
          onFocus={handleItemFocus}
          row={row}
        />
        <Input
          className="Grid-cell Grid-numeric"
          column={1}
          defaultValue={item.cost}
          disabled={props.loading || !props.writeAccess}
          id={`cost-${item.id}`}
          numberFormat="currency"
          onBlur={handleCostBlur}
          onFocus={handleItemFocus}
          row={row}
        />
        <Select
          className="Grid-cell"
          column={2}
          defaultValue={item.buyer}
          disabled={props.loading || !props.writeAccess}
          id={`buyer-${item.id}`}
          onChange={handleBuyerChange}
          onFocus={handleItemFocus}
          options={contributors}
          row={row}
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

  const handleFloatingMenuBlur: FocusEventHandler<HTMLDivElement> = (e) => {
    if (props.writeAccess) {
      const target = lastSelectedCell.current;
      if (target && !e.relatedTarget?.closest(".FloatingMenu-root")) {
        togglePeripheralClasses(
          target,
          parseNumericValue(locale, target.dataset.column),
          parseNumericValue(locale, target.dataset.row),
          false
        );
      }
    }
  };

  const handleGridBlur: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (props.writeAccess) {
      const floatingMenu = floatingMenuRef.current;
      if (floatingMenu) {
        if (!e.relatedTarget?.closest(".FloatingMenu-root")) {
          const target = e.target;
          togglePeripheralClasses(
            target,
            parseNumericValue(locale, target.dataset.column),
            parseNumericValue(locale, target.dataset.row),
            false
          );
          if (!e.relatedTarget?.closest(".Grid-data")) {
            floatingMenu.setAnchor(null);
          }
        }
      }
    }
  };

  const handleGridFocus: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (props.writeAccess) {
      const target = e.target;
      lastSelectedCell.current = target;
      const floatingMenu = floatingMenuRef.current;
      if (floatingMenu) {
        togglePeripheralClasses(
          target,
          parseNumericValue(locale, target.dataset.column),
          parseNumericValue(locale, target.dataset.row),
          true
        );
        floatingMenu.setAnchor(target);
      }
    }
  };

  return (
    <div className={`Grid-container ${props.className}`}>
      <section className="Grid-data" onBlur={handleGridBlur} onFocus={handleGridFocus}>
        <span className="Grid-header">{props.strings["item"]}</span>
        <span className="Grid-header Grid-numeric">{props.strings["cost"]}</span>
        <span className="Grid-header">{props.strings["buyer"]}</span>
        {renderContributors}
        {renderItems}
      </section>
      <section className="Grid-description Grid-numeric Grid-total CheckTotal-root">
        <span className="CheckTotal-header">{props.strings["checkTotal"]}</span>
        <span className="CheckTotal-value">
          {formatCurrency(locale, toSnapshot(totalCost).amount)}
        </span>
      </section>
      {renderTotals}
      <FloatingMenu onBlur={handleFloatingMenuBlur} ref={floatingMenuRef} />
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

      &:not(:disabled) {
        &:not(.selected) {
          &.focused {
            background: ${theme.palette.action.focus};
          }

          &.peripheral {
            background: ${theme.palette.action.hover};
          }
        }

        &.selected {
          background: ${theme.palette.action.selected};
          outline: 2px solid ${theme.palette.primary.main};
        }
      }
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
