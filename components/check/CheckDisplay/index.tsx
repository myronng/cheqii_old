import { Button, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FloatingMenu, FloatingMenuOption } from "components/check/CheckDisplay/FloatingMenu";
import { Input } from "components/check/CheckDisplay/Input";
import { Select } from "components/check/CheckDisplay/Select";
import { BaseProps, CheckInput } from "declarations";
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
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";
import {
  isNumber,
  isNumericFormat,
  parseDineroAmount,
  parseDineroMap,
  parseCurrencyAmount,
  parseRatioAmount,
} from "services/parser";

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  checkData: CheckInput;
  loading: boolean;
  onBuyerBlur?: (event: FocusEvent<HTMLSelectElement>, index: number) => void;
  onBuyerChange?: (event: ChangeEvent<HTMLSelectElement>, index: number) => void;
  onContributorBlur?: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onContributorChange?: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
  onContributorDelete?: (event: MouseEvent<HTMLButtonElement>, index: number) => void;
  onContributorSummaryClick: (index: number) => void;
  onCostBlur?: (event: FocusEvent<HTMLInputElement>, index: number) => void;
  onCostChange?: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
  onCostFocus?: (event: ChangeEvent<HTMLInputElement>, index: number) => void;
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
    contributorIndex: number
  ) => void;
  onSplitFocus?: (
    event: FocusEvent<HTMLInputElement>,
    itemIndex: number,
    contributorIndex: number
  ) => void;
  writeAccess: boolean;
};

export type TotalsHandle = {
  totalPaid: Map<number, Dinero<number>>;
  totalOwing: Map<number, Dinero<number>>;
};

export const CheckDisplay = styled(
  forwardRef<TotalsHandle, CheckDisplayProps>((props, ref) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const [selection, setSelection] = useState<{
      anchor: HTMLElement;
      column: number;
      options: FloatingMenuOption[];
      row: number;
    } | null>(null);
    const currency = getCurrencyType(locale);
    let totalCost = dinero({ amount: 0, currency });
    const totalPaid = new Map<number, Dinero<number>>();
    const totalOwing = new Map<number, Dinero<number>>();

    useImperativeHandle(ref, () => ({
      totalPaid,
      totalOwing,
    }));

    const buyerOptions = props.checkData.contributors.map((option, index) => (
      <option className="Select-option" key={option.id} value={index}>
        {option.name.dirty}
      </option>
    ));

    const renderItems = props.checkData.items.map((item, itemIndex) => {
      const row = itemIndex + 1;
      const buyerTotalPaid = totalPaid.get(item.buyer.dirty) || dinero({ amount: 0, currency });
      const itemCost = parseCurrencyAmount(locale, currency, item.cost.dirty);
      totalPaid.set(item.buyer.dirty, add(buyerTotalPaid, dinero({ amount: itemCost, currency })));

      totalCost = add(totalCost, dinero({ amount: itemCost, currency }));

      const splitNumeric: number[] = [];
      let hasPositiveSplit = false;
      const renderSplit = item.split.map((split, splitIndex) => {
        const currentSplit = parseRatioAmount(locale, split.dirty);
        if (!isNumber(currentSplit)) {
          // Convert any NaN/Infinity to 0
          splitNumeric[splitIndex] = 0;
        } else if (currentSplit > 0) {
          hasPositiveSplit = true;
          splitNumeric[splitIndex] = currentSplit;
        }
        const column = splitIndex + 3;
        const contributorId = props.checkData.contributors[splitIndex].id;

        const handleSplitBlur: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
          if (props.writeAccess && typeof props.onSplitBlur === "function") {
            props.onSplitBlur(e, itemIndex, splitIndex);
          }
        }, []);

        const handleSplitChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
          const value = e.target.value;
          if (
            props.writeAccess &&
            isNumericFormat(locale, value, ["group", "literal"]) &&
            typeof props.onSplitChange === "function"
          ) {
            props.onSplitChange(e, itemIndex, splitIndex);
          }
        }, []);

        const handleSplitFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
          if (props.writeAccess && typeof props.onSplitFocus === "function") {
            props.onSplitFocus(e, itemIndex, splitIndex);
          }
        }, []);

        let className = "";
        if (selection !== null) {
          if (selection.column === column && selection.row === row) {
            className = "selected";
          } else if (selection.column === column || selection.row === row) {
            className = "peripheral";
          }
        }

        return (
          <Input
            aria-label={props.strings["contribution"]}
            className={`Grid-input Grid-numeric ${className}`}
            data-column={column}
            data-row={row}
            disabled={props.loading || !props.writeAccess}
            key={`${item.id}-${contributorId}`}
            onBlur={handleSplitBlur}
            onChange={handleSplitChange}
            onFocus={handleSplitFocus}
            value={split.dirty}
          />
        );
      });

      if (hasPositiveSplit) {
        const splitCosts = allocate(dinero({ amount: itemCost, currency }), splitNumeric);
        splitCosts.forEach((split, splitIndex) => {
          const splitOwing = totalOwing.get(splitIndex) || dinero({ amount: 0, currency });
          totalOwing.set(splitIndex, add(splitOwing, split));
        });
      }

      const handleBuyerBlur: FocusEventHandler<HTMLSelectElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onBuyerBlur === "function") {
          props.onBuyerBlur(e, itemIndex);
        }
      }, []);

      const handleBuyerChange: ChangeEventHandler<HTMLSelectElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onBuyerChange === "function") {
          props.onBuyerChange(e, itemIndex);
        }
      }, []);

      const handleCostBlur: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onCostBlur === "function") {
          props.onCostBlur(e, itemIndex);
        }
      }, []);

      const handleCostChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        const value = e.target.value;
        if (
          props.writeAccess &&
          isNumericFormat(locale, value, ["currency", "group", "decimal", "literal"]) &&
          typeof props.onCostChange === "function"
        ) {
          props.onCostChange(e, itemIndex);
        }
      }, []);

      const handleCostFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onCostFocus === "function") {
          props.onCostFocus(e, itemIndex);
        }
      }, []);

      const handleNameBlur: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onNameBlur === "function") {
          props.onNameBlur(e, itemIndex);
        }
      }, []);

      const handleNameChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onNameChange === "function") {
          props.onNameChange(e, itemIndex);
        }
      }, []);

      let buyerClassName = "",
        costClassName = "",
        nameClassName = "";
      if (selection !== null) {
        if (selection.row === row) {
          if (selection.column === 0) {
            buyerClassName = "peripheral";
            costClassName = "peripheral";
            nameClassName = "selected";
          } else if (selection.column === 1) {
            buyerClassName = "peripheral";
            costClassName = "selected";
            nameClassName = "peripheral";
          } else if (selection.column === 2) {
            buyerClassName = "selected";
            costClassName = "peripheral";
            nameClassName = "peripheral";
          } else {
            buyerClassName = "peripheral";
            costClassName = "peripheral";
            nameClassName = "peripheral";
          }
        } else {
          if (selection.column === 0) {
            nameClassName = "peripheral";
          } else if (selection.column === 1) {
            costClassName = "peripheral";
          } else if (selection.column === 2) {
            buyerClassName = "peripheral";
          }
        }
      }

      return (
        <Fragment key={item.id}>
          <Input
            aria-labelledby="name"
            className={`Grid-input ${nameClassName}`}
            data-column={0}
            data-row={row}
            disabled={props.loading || !props.writeAccess}
            onBlur={handleNameBlur}
            onChange={handleNameChange}
            value={item.name.dirty}
          />
          <Input
            aria-labelledby="cost"
            className={`Grid-input Grid-numeric ${costClassName}`}
            data-column={1}
            data-row={row}
            disabled={props.loading || !props.writeAccess}
            onBlur={handleCostBlur}
            onChange={handleCostChange}
            onFocus={handleCostFocus}
            value={item.cost.dirty}
          />
          <Select
            aria-labelledby="buyer"
            className={`Grid-input ${buyerClassName}`}
            data-column={2}
            data-row={row}
            disabled={props.loading || !props.writeAccess}
            onBlur={handleBuyerBlur}
            onChange={handleBuyerChange}
            value={item.buyer.dirty}
          >
            {buyerOptions}
          </Select>
          {renderSplit}
        </Fragment>
      );
    });

    const renderContributors: JSX.Element[] = [];
    const renderTotals = props.checkData.contributors.map((contributor, contributorIndex) => {
      const column = contributorIndex + 3;
      const row = 0;

      const handleContributorBlur: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onContributorBlur === "function") {
          props.onContributorBlur(e, contributorIndex);
        }
      }, []);

      const handleContributorChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onContributorChange === "function") {
          props.onContributorChange(e, contributorIndex);
        }
      }, []);

      let className = "";
      if (selection !== null) {
        if (selection.column === column && selection.row === row) {
          className = "selected";
        } else if (selection.column === column || selection.row === row) {
          className = "peripheral";
        }
      }

      renderContributors.push(
        <Input
          aria-label={props.strings["contributorName"]}
          className={`Grid-input Grid-numeric ${className}`}
          data-column={column}
          data-row={row}
          disabled={props.loading || !props.writeAccess}
          key={contributor.id}
          onBlur={handleContributorBlur}
          onChange={handleContributorChange}
          value={contributor.name.dirty}
        />
      );

      const totalPaidDinero = parseDineroMap(currency, totalPaid, contributorIndex);
      const totalOwingDinero = parseDineroMap(currency, totalOwing, contributorIndex);

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
        if (!e.relatedTarget?.closest(".FloatingMenu-root")) {
          setSelection(null);
        }
      }
    };

    const handleGridBlur: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
      if (props.writeAccess) {
        if (
          !e.relatedTarget?.closest(".FloatingMenu-root") && // Use optional chaining to allow e.relatedTarget === null
          !e.relatedTarget?.classList.contains("FloatingMenu-root")
        ) {
          setSelection(null);
        }
      }
    };

    const handleGridFocus: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
      if (props.writeAccess) {
        const column = Number(e.target.dataset.column);
        const row = Number(e.target.dataset.row);
        const floatingMenuOptions: FloatingMenuOption[] = [];
        // Account for contributor row
        if (row >= 1) {
          floatingMenuOptions.push({
            color: "error",
            id: "deleteRow",
            label: props.strings["deleteRow"],
            onClick: (e) => {
              setSelection(null);
              if (props.writeAccess && typeof props.onItemDelete === "function") {
                props.onItemDelete(e, row - 1);
              }
            },
          });
        }
        // Account for item name, cost, and buyer columns
        if (column >= 3) {
          floatingMenuOptions.push({
            color: "error",
            id: "deleteColumn",
            label: props.strings["deleteColumn"],
            onClick: (e) => {
              setSelection(null);
              // Check for writeAccess to handle access being changed after initial render
              if (props.writeAccess && typeof props.onContributorDelete === "function") {
                props.onContributorDelete(e, column - 3);
              }
            },
          });
        }
        setSelection({
          anchor: e.target,
          column,
          options: floatingMenuOptions,
          row,
        });
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
        <FloatingMenu
          onBlur={handleFloatingMenuBlur}
          options={selection?.options}
          PopperProps={{ anchorEl: selection?.anchor }}
        />
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

    & .Grid-input {
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
