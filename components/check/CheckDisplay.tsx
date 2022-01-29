import { Button, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FloatingMenu, FloatingMenuHandle } from "components/check/FloatingMenu";
import { Input } from "components/check/Input";
import { Select } from "components/check/Select";
import { BaseProps, Check, Item } from "declarations";
import { add, allocate, Dinero, dinero, subtract } from "dinero.js";
import { useRouter } from "next/router";
import {
  ChangeEvent,
  ChangeEventHandler,
  FocusEvent,
  FocusEventHandler,
  forwardRef,
  Fragment,
  MouseEvent,
  useImperativeHandle,
  useRef,
} from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { isNumber, parseDineroAmount, parseDineroMap } from "services/parser";

type GetTarget = () => HTMLElement | null;

type ToggleTarget = (target: HTMLElement, active: boolean) => void;

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  contributors: NonNullable<Check["contributors"]>;
  items: Item[];
  loading: boolean;
  onBuyerChange?: (event: ChangeEvent<HTMLSelectElement>, index: number) => void;
  onContributorBlur?: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onContributorDelete?: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
  onContributorSummaryClick: (index: number) => void;
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

export type Column = number;

export type Row = number;

export type TotalsHandle = {
  floatingMenu: FloatingMenuHandle | null;
  getTarget: GetTarget;
  toggleTarget: ToggleTarget;
  totalPaid: Map<number, Dinero<number>>;
  totalOwing: Map<number, Dinero<number>>;
};

export const CheckDisplay = styled(
  forwardRef<TotalsHandle, CheckDisplayProps>((props, ref) => {
    const router = useRouter();
    const floatingMenuRef = useRef<FloatingMenuHandle>(null);
    const currentTarget = useRef<HTMLElement | null>(null);
    const locale = router.locale ?? router.defaultLocale!;
    const currency = getCurrencyType(locale);
    const contributors = props.contributors;
    const items = props.items;
    let totalCost = dinero({ amount: 0, currency });
    const totalPaid = new Map<number, Dinero<number>>();
    const totalOwing = new Map<number, Dinero<number>>();

    const getTarget: GetTarget = () => currentTarget.current;

    const toggleTarget: ToggleTarget = (target, active) => {
      const container = target.closest(".Grid-data");
      if (container !== null) {
        const column = target.dataset.column;
        const row = target.dataset.row;
        const columnPeripherals = container.querySelectorAll(`[data-column="${column}"]`);
        columnPeripherals.forEach((columnNode) => {
          if (columnNode instanceof HTMLElement && columnNode.dataset.row !== row) {
            columnNode.classList.toggle("peripheral", active);
          }
        });
        const rowPeripherals = container.querySelectorAll(`[data-row="${row}"]`);
        rowPeripherals.forEach((rowNode) => {
          if (rowNode instanceof HTMLElement && rowNode.dataset.column !== column) {
            rowNode.classList.toggle("peripheral", active);
          }
        });
        target.classList.toggle("selected", active);
      }

      const newTarget = active ? target : null;
      currentTarget.current = newTarget;
      const floatingMenu = floatingMenuRef.current;
      if (floatingMenu) {
        floatingMenu.setAnchor(newTarget);
      }
    };

    useImperativeHandle(ref, () => ({
      floatingMenu: floatingMenuRef.current,
      getTarget,
      toggleTarget,
      totalPaid,
      totalOwing,
    }));

    const renderContributors = contributors.map((contributor, contributorIndex) => {
      const column = contributorIndex + 3;
      const row = 0;

      const handleContributorBlur: FocusEventHandler<HTMLInputElement> = (e) => {
        if (props.writeAccess && typeof props.onContributorBlur === "function") {
          props.onContributorBlur(e, contributorIndex);
        }
      };

      const handleContributorFocus: FocusEventHandler<HTMLInputElement> = (_e) => {
        if (props.writeAccess) {
          const floatingMenu = floatingMenuRef.current;
          if (floatingMenu) {
            floatingMenu.setOptions([
              {
                color: "error",
                id: "deleteColumn",
                label: props.strings["deleteColumn"],
                onClick: (e) => {
                  const target = currentTarget.current;
                  if (target) {
                    toggleTarget(target, false);
                  }
                  // Check for writeAccess to handle access being changed after initial render
                  if (props.writeAccess && typeof props.onContributorDelete === "function") {
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
          defaultValue={contributor.name}
          disabled={props.loading || !props.writeAccess}
          id={`contributor-${contributor.id}`}
          key={contributor.id}
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
        let numericSplit = split;
        if (!isNumber(split)) {
          // Convert any NaN/Infinity to 0
          splits[splitIndex] = 0;
          numericSplit = 0;
        }
        const column = splitIndex + 3;
        const contributorId = contributors[splitIndex].id;

        const handleSplitBlur: FocusEventHandler<HTMLInputElement> = (e) => {
          if (props.writeAccess && typeof props.onSplitBlur === "function") {
            props.onSplitBlur(e, itemIndex, splitIndex);
          }
        };

        const handleSplitFocus: FocusEventHandler<HTMLInputElement> = (_e) => {
          if (props.writeAccess) {
            const floatingMenu = floatingMenuRef.current;
            if (floatingMenu) {
              floatingMenu.setOptions([
                {
                  color: "error",
                  id: "deleteRow",
                  label: props.strings["deleteRow"],
                  onClick: (e) => {
                    const target = currentTarget.current;
                    if (target) {
                      toggleTarget(target, false);
                    }
                    if (props.writeAccess && typeof props.onItemDelete === "function") {
                      props.onItemDelete(e, itemIndex);
                    }
                  },
                },
                {
                  color: "error",
                  id: "deleteColumn",
                  label: props.strings["deleteColumn"],
                  onClick: (e) => {
                    const target = currentTarget.current;
                    if (target) {
                      toggleTarget(target, false);
                    }
                    if (props.writeAccess && typeof props.onContributorDelete === "function") {
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
            defaultValue={numericSplit}
            disabled={props.loading || !props.writeAccess}
            id={`split-${item.id}-${contributorId}`}
            key={`${item.id}-${contributorId}`}
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

      const handleItemFocus: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (_e) => {
        if (props.writeAccess) {
          const floatingMenu = floatingMenuRef.current;
          if (floatingMenu) {
            floatingMenu.setOptions([
              {
                color: "error",
                id: "deleteRow",
                label: props.strings["deleteRow"],
                onClick: (e) => {
                  const target = currentTarget.current;
                  if (target) {
                    toggleTarget(target, false);
                  }
                  if (props.writeAccess && typeof props.onItemDelete === "function") {
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
            row={row}
          >
            {contributors.map((option, index) => (
              <option className="Select-option" key={option.id} value={index}>
                {option.name}
              </option>
            ))}
          </Select>
          {renderSplit}
        </Fragment>
      );
    });

    const renderTotals = contributors.map((contributor, contributorIndex) => {
      const totalPaidDinero = parseDineroMap(locale, totalPaid, contributorIndex);
      const totalOwingDinero = parseDineroMap(locale, totalOwing, contributorIndex);

      const handleSummaryClick = () => {
        props.onContributorSummaryClick(contributorIndex);
      };

      return (
        <Button
          className="Grid-total Grid-summary"
          color="inherit"
          key={`${contributor}-${contributorIndex}`}
          onClick={handleSummaryClick}
        >
          <span className="Grid-numeric">
            {formatCurrency(locale, parseDineroAmount(totalPaidDinero))}
          </span>
          <span className="Grid-numeric">
            {formatCurrency(locale, parseDineroAmount(totalOwingDinero))}
          </span>
          <span className="Grid-numeric">
            {formatCurrency(locale, parseDineroAmount(subtract(totalPaidDinero, totalOwingDinero)))}
          </span>
        </Button>
      );
    });

    renderTotals.unshift(
      <div className="Grid-total" key={-1}>
        <span className="Grid-footer">{props.strings["totalPaid"]}</span>
        <span className="Grid-footer">{props.strings["totalOwing"]}</span>
        <span className="Grid-footer">{props.strings["balance"]}</span>
      </div>
    );

    const handleFloatingMenuBlur: FocusEventHandler<HTMLDivElement> = (e) => {
      if (props.writeAccess) {
        const floatingMenu = floatingMenuRef.current;
        if (floatingMenu) {
          const target = currentTarget.current;
          if (target && !e.relatedTarget?.closest(".FloatingMenu-root")) {
            toggleTarget(target, false);
          }
        }
      }
    };

    const handleGridBlur: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
      if (props.writeAccess) {
        if (
          !e.relatedTarget?.closest(".FloatingMenu-root") && // Use optional chaining to allow e.relatedTarget === null
          !e.relatedTarget?.classList.contains("FloatingMenu-root")
        ) {
          const target = e.target;
          toggleTarget(target, false);
        }
      }
    };

    const handleGridFocus: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
      if (props.writeAccess) {
        const target = e.target;
        toggleTarget(target, true);
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
        <Divider className="Grid-divider" />
        <section className="Grid-footer Grid-numeric Grid-total CheckTotal-root">
          <span className="CheckTotal-header">{props.strings["checkTotal"]}</span>
          <span className="CheckTotal-value">
            {formatCurrency(locale, parseDineroAmount(totalCost))}
          </span>
        </section>
        {renderTotals}
        <FloatingMenu onBlur={handleFloatingMenuBlur} ref={floatingMenuRef} />
      </div>
    );
  })
)`
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
          &.peripheral {
            background: ${theme.palette.action.focus};
            // Use focus for .peripheral and disabled for .selected to not conflict with hover
          }
        }

        &.selected {
          background: ${theme.palette.action.disabled};
          outline: 2px solid ${theme.palette.primary.main};
        }
      }
    }

    & .Grid-data {
      display: contents;
    }

    & .Grid-divider {
      grid-column: 1/-1;
      margin: ${theme.spacing(1, 0)};
    }

    & .Grid-footer {
      color: ${theme.palette.text.disabled};
      height: 100%;
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

    & .Grid-summary {
      align-items: flex-end;
      border-radius: 0;
      color: inherit;
      font-family: inherit;
      font-weight: inherit;
      transition: none;
      white-space: nowrap;
    }

    & .Grid-total {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      height: 100%;
      padding: ${theme.spacing(1, 2)};
    }

    & .CheckTotal-root {
      font-family: Fira Code;
      grid-column: span 2;
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

CheckDisplay.displayName = "CheckDisplay";
