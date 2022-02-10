import { Button, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FloatingMenu, FloatingMenuHandle } from "components/check/FloatingMenu";
import { Input } from "components/check/Input";
import { Select } from "components/check/Select";
import { BaseProps, Check } from "declarations";
import { add, allocate, Currency, Dinero, dinero, subtract } from "dinero.js";
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
  useState,
} from "react";
import { formatCurrency, formatRatio } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { isNumber, parseDineroAmount, parseDineroMap, parseNumericFormat } from "services/parser";

type GetTarget = () => HTMLElement | null;

type ToggleTarget = (target: HTMLElement, active: boolean) => void;

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  checkData: Check;
  loading: boolean;
  onBuyerChange?: (event: ChangeEvent<HTMLSelectElement>, index: number) => void;
  onBuyerBlur?: (event: FocusEvent<HTMLSelectElement>, index: number) => void;
  onContributorBlur?: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onContributorChange?: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
  onContributorDelete?: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
  onContributorSummaryClick: (index: number) => void;
  onCostBlur?: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onCostChange?: (event: ChangeEvent<HTMLInputElement>, index: number, rawCost: number) => void;
  onItemDelete?: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
  onNameBlur?: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onNameChange?: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
  onSplitBlur?: (
    event: FocusEvent<HTMLInputElement>,
    itemIndex: number,
    contributorIndex: number
  ) => void;
  onSplitChange?: (
    event: ChangeEvent<HTMLInputElement>,
    itemIndex: number,
    contributorIndex: number,
    rawRatio: number
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

const CURRENCY_MAX = 9999999.99;
const CURRENCY_MIN = 0;
const RATIO_MAX = 9999999;
const RATIO_MIN = 0;

const getRawCurrencyAmount = (locale: string, currency: Currency<number>, value: string) => {
  const unformattedCost = parseNumericFormat(locale, value, CURRENCY_MIN, CURRENCY_MAX);
  return Math.round(unformattedCost * Math.pow(currency.base, currency.exponent));
};

export const CheckDisplay = styled(
  forwardRef<TotalsHandle, CheckDisplayProps>((props, ref) => {
    const router = useRouter();
    const floatingMenuRef = useRef<FloatingMenuHandle>(null);
    const currentTarget = useRef<HTMLElement | null>(null);
    const locale = router.locale ?? router.defaultLocale!;
    const [checkInputs, setCheckInputs] = useState({
      contributors: props.checkData.contributors,
      items: props.checkData.items.map(({ cost, split, ...item }) => ({
        ...item,
        cost: formatCurrency(locale, cost),
        split: split.map((amount) => formatRatio(locale, amount)),
      })),
    });
    const currency = getCurrencyType(locale);
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

    const renderItems = props.checkData.items.map((item, itemIndex) => {
      const row = itemIndex + 1;
      const buyerTotalPaid = totalPaid.get(item.buyer) || dinero({ amount: 0, currency });
      totalPaid.set(item.buyer, add(buyerTotalPaid, dinero({ amount: item.cost, currency })));

      totalCost = add(totalCost, dinero({ amount: item.cost, currency }));

      const splits = item.split ?? [];
      const renderSplit = splits.map((split, splitIndex) => {
        if (!isNumber(split)) {
          // Convert any NaN/Infinity to 0
          splits[splitIndex] = 0;
        }
        const column = splitIndex + 3;
        const contributorId = props.checkData.contributors[splitIndex].id;

        const handleSplitBlur: FocusEventHandler<HTMLInputElement> = (e) => {
          if (props.writeAccess && typeof props.onSplitBlur === "function") {
            const newCheckInputs = { ...checkInputs };
            const rawRatio = parseNumericFormat(locale, e.target.value, RATIO_MIN, RATIO_MAX);
            newCheckInputs.items[itemIndex].split[splitIndex] = formatRatio(locale, rawRatio);
            setCheckInputs(newCheckInputs);
            props.onSplitBlur(e, itemIndex, splitIndex);
          }
        };

        const handleSplitChange: ChangeEventHandler<HTMLInputElement> = (e) => {
          const value = e.target.value;
          if (props.writeAccess && isNumber(Number(value))) {
            const newCheckInputs = { ...checkInputs };
            newCheckInputs.items[itemIndex].split[splitIndex] = value;
            setCheckInputs(newCheckInputs);
            if (typeof props.onSplitChange === "function") {
              const rawRatio = parseNumericFormat(locale, value, RATIO_MIN, RATIO_MAX);
              props.onSplitChange(e, itemIndex, splitIndex, rawRatio);
            }
          }
        };

        const handleSplitFocus: FocusEventHandler<HTMLInputElement> = (_e) => {
          if (props.writeAccess) {
            const newCheckInputs = { ...checkInputs };
            newCheckInputs.items[itemIndex].split[splitIndex] = parseNumericFormat(
              locale,
              checkInputs.items[itemIndex].split[splitIndex]
            ).toString();
            setCheckInputs(newCheckInputs);
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
            aria-label={props.strings["contribution"]}
            className="Grid-cell Grid-numeric"
            column={column}
            disabled={props.loading || !props.writeAccess}
            key={`${item.id}-${contributorId}`}
            onBlur={handleSplitBlur}
            onChange={handleSplitChange}
            onFocus={handleSplitFocus}
            row={row}
            value={checkInputs.items[itemIndex].split[splitIndex]}
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

      const handleBuyerBlur: FocusEventHandler<HTMLSelectElement> = (e) => {
        if (props.writeAccess && typeof props.onBuyerBlur === "function") {
          props.onBuyerBlur(e, itemIndex);
        }
      };

      const handleBuyerChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
        if (props.writeAccess && typeof props.onBuyerChange === "function") {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.items[itemIndex].buyer = e.target.selectedIndex;
          setCheckInputs(newCheckInputs);
          props.onBuyerChange(e, itemIndex);
        }
      };

      const handleCostBlur: FocusEventHandler<HTMLInputElement> = (e) => {
        if (props.writeAccess && typeof props.onCostBlur === "function") {
          const newCheckInputs = { ...checkInputs };
          const rawCost = getRawCurrencyAmount(locale, currency, e.target.value);
          newCheckInputs.items[itemIndex].cost = formatCurrency(locale, rawCost);
          setCheckInputs(newCheckInputs);
          props.onCostBlur(e, itemIndex);
        }
      };

      const handleCostChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        const value = e.target.value;
        if (props.writeAccess && isNumber(Number(value))) {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.items[itemIndex].cost = value;
          setCheckInputs(newCheckInputs);
          if (typeof props.onCostChange === "function") {
            const rawCost = getRawCurrencyAmount(locale, currency, value);
            props.onCostChange(e, itemIndex, rawCost);
          }
        }
      };

      const handleCostFocus: FocusEventHandler<HTMLInputElement> = (e) => {
        if (props.writeAccess) {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.items[itemIndex].cost = parseNumericFormat(
            locale,
            checkInputs.items[itemIndex].cost
          ).toString();
          setCheckInputs(newCheckInputs);
        }
        handleItemFocus(e);
      };

      const handleNameBlur: FocusEventHandler<HTMLInputElement> = (e) => {
        if (props.writeAccess && typeof props.onNameBlur === "function") {
          props.onNameBlur(e, itemIndex);
        }
      };

      const handleNameChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        if (props.writeAccess && typeof props.onNameChange === "function") {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.items[itemIndex].name = e.target.value;
          setCheckInputs(newCheckInputs);
          props.onNameChange(e, itemIndex);
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
            aria-labelledby="name"
            className="Grid-cell"
            column={0}
            disabled={props.loading || !props.writeAccess}
            onBlur={handleNameBlur}
            onChange={handleNameChange}
            onFocus={handleItemFocus}
            row={row}
            value={checkInputs.items[itemIndex].name}
          />
          <Input
            aria-labelledby="cost"
            className="Grid-cell Grid-numeric"
            column={1}
            disabled={props.loading || !props.writeAccess}
            onBlur={handleCostBlur}
            onChange={handleCostChange}
            onFocus={handleCostFocus}
            row={row}
            value={checkInputs.items[itemIndex].cost}
          />
          <Select
            aria-labelledby="buyer"
            className="Grid-cell"
            column={2}
            disabled={props.loading || !props.writeAccess}
            onBlur={handleBuyerBlur}
            onChange={handleBuyerChange}
            onFocus={handleItemFocus}
            row={row}
            value={checkInputs.items[itemIndex].buyer}
          >
            {props.checkData.contributors.map((option, index) => (
              <option className="Select-option" key={option.id} value={index}>
                {option.name}
              </option>
            ))}
          </Select>
          {renderSplit}
        </Fragment>
      );
    });

    const renderContributors: JSX.Element[] = [];
    const renderTotals = props.checkData.contributors.map((contributor, contributorIndex) => {
      const column = contributorIndex + 3;
      const row = 0;

      const handleContributorBlur: FocusEventHandler<HTMLInputElement> = (e) => {
        if (props.writeAccess && typeof props.onContributorBlur === "function") {
          props.onContributorBlur(e, contributorIndex);
        }
      };

      const handleContributorChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        if (props.writeAccess && typeof props.onContributorChange === "function") {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.contributors[contributorIndex].name = e.target.value;
          setCheckInputs(newCheckInputs);
          props.onContributorChange(e, contributorIndex);
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

      renderContributors.push(
        <Input
          aria-label={props.strings["contributorName"]}
          className="Grid-cell Grid-numeric"
          column={column}
          disabled={props.loading || !props.writeAccess}
          key={contributor.id}
          onBlur={handleContributorBlur}
          onChange={handleContributorChange}
          onFocus={handleContributorFocus}
          row={row}
          value={checkInputs.contributors[contributorIndex].name}
        />
      );

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
          <span className="Grid-header" id="name">
            {props.strings["item"]}
          </span>
          <span className="Grid-header Grid-numeric" id="cost">
            {props.strings["cost"]}
          </span>
          <span className="Grid-header" id="buyer">
            {props.strings["buyer"]}
          </span>
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
  ${({ checkData, theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    // Item column can't rely on max-content alone since <input> doesn't fit to its content
    grid-template-columns: 1fr min-content min-content ${
      checkData.contributors.length ? `repeat(${checkData.contributors.length}, min-content)` : ""
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
