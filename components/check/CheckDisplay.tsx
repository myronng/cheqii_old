import { Button, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FloatingMenu, FloatingMenuOption } from "components/check/FloatingMenu";
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
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { formatCurrency, formatRatio } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { isNumber, parseDineroAmount, parseDineroMap, parseNumericFormat } from "services/parser";

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

export type TotalsHandle = {
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
    const locale = router.locale ?? router.defaultLocale!;
    const [checkInputs, setCheckInputs] = useState({
      contributors: props.checkData.contributors.map((contributor) => ({
        clean: contributor.name,
        dirty: contributor.name,
      })),
      items: props.checkData.items.map((item) => {
        const cost = formatCurrency(locale, item.cost);
        return {
          buyer: {
            clean: item.buyer,
            dirty: item.buyer,
          },
          cost: {
            clean: cost,
            dirty: cost,
          },
          name: {
            clean: item.name,
            dirty: item.name,
          },
          split: item.split.map((amount) => {
            const split = formatRatio(locale, amount);
            return {
              clean: split,
              dirty: split,
            };
          }),
        };
      }),
    });
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

        const handleSplitBlur: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
          if (props.writeAccess && typeof props.onSplitBlur === "function") {
            const newCheckInputs = { ...checkInputs };
            const newSplit = newCheckInputs.items[itemIndex].split[splitIndex];
            newSplit.dirty = formatRatio(
              locale,
              parseNumericFormat(locale, e.target.value, RATIO_MIN, RATIO_MAX)
            );
            if (newSplit.clean !== newSplit.dirty) {
              newSplit.clean = newSplit.dirty;
              props.onSplitBlur(e, itemIndex, splitIndex);
            }
            setCheckInputs(newCheckInputs);
          }
        }, []);

        const handleSplitChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
          const value = e.target.value;
          if (props.writeAccess && isNumber(Number(value))) {
            const newCheckInputs = { ...checkInputs };
            newCheckInputs.items[itemIndex].split[splitIndex].dirty = value;
            setCheckInputs(newCheckInputs);
            if (typeof props.onSplitChange === "function") {
              const rawRatio = parseNumericFormat(locale, value, RATIO_MIN, RATIO_MAX);
              props.onSplitChange(e, itemIndex, splitIndex, rawRatio);
            }
          }
        }, []);

        const handleSplitFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
          if (props.writeAccess) {
            setSelection({
              anchor: e.target,
              column,
              options: [
                {
                  color: "error",
                  id: "deleteRow",
                  label: props.strings["deleteRow"],
                  onClick: (e) => {
                    setSelection(null);
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
                    setSelection(null);
                    if (props.writeAccess && typeof props.onContributorDelete === "function") {
                      props.onContributorDelete(e, splitIndex);
                    }
                  },
                },
              ],
              row,
            });
            const newCheckInputs = { ...checkInputs };
            newCheckInputs.items[itemIndex].split[splitIndex].dirty = parseNumericFormat(
              locale,
              checkInputs.items[itemIndex].split[splitIndex].dirty
            ).toString();
            setCheckInputs(newCheckInputs);
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
            className={`Grid-cell Grid-numeric ${className}`}
            disabled={props.loading || !props.writeAccess}
            key={`${item.id}-${contributorId}`}
            onBlur={handleSplitBlur}
            onChange={handleSplitChange}
            onFocus={handleSplitFocus}
            value={checkInputs.items[itemIndex].split[splitIndex].dirty}
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

      const handleBuyerBlur: FocusEventHandler<HTMLSelectElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onBuyerBlur === "function") {
          const newCheckInputs = { ...checkInputs };
          const newBuyer = newCheckInputs.items[itemIndex].buyer;
          if (newBuyer.clean !== newBuyer.dirty) {
            newBuyer.clean = newBuyer.dirty;
            props.onBuyerBlur(e, itemIndex);
          }
          setCheckInputs(newCheckInputs);
        }
      }, []);

      const handleBuyerChange: ChangeEventHandler<HTMLSelectElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onBuyerChange === "function") {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.items[itemIndex].buyer.dirty = e.target.selectedIndex;
          setCheckInputs(newCheckInputs);
          props.onBuyerChange(e, itemIndex);
        }
      }, []);

      const handleBuyerFocus: FocusEventHandler<HTMLSelectElement> = useCallback((e) => {
        if (props.writeAccess) {
          setSelection({
            anchor: e.target,
            column: 2,
            options: [
              {
                color: "error",
                id: "deleteRow",
                label: props.strings["deleteRow"],
                onClick: (e) => {
                  setSelection(null);
                  if (props.writeAccess && typeof props.onItemDelete === "function") {
                    props.onItemDelete(e, itemIndex);
                  }
                },
              },
            ],
            row,
          });
        }
      }, []);

      const handleCostBlur: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onCostBlur === "function") {
          const newCheckInputs = { ...checkInputs };
          const rawCost = getRawCurrencyAmount(locale, currency, e.target.value);
          const newCost = newCheckInputs.items[itemIndex].cost;
          newCost.dirty = formatCurrency(locale, rawCost);
          if (newCost.clean !== newCost.dirty) {
            newCost.clean = newCost.dirty;
            props.onCostBlur(e, itemIndex);
          }
          setCheckInputs(newCheckInputs);
        }
      }, []);

      const handleCostChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        const value = e.target.value;
        if (props.writeAccess && isNumber(Number(value))) {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.items[itemIndex].cost.dirty = value;
          setCheckInputs(newCheckInputs);
          if (typeof props.onCostChange === "function") {
            const rawCost = getRawCurrencyAmount(locale, currency, value);
            props.onCostChange(e, itemIndex, rawCost);
          }
        }
      }, []);

      const handleCostFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess) {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.items[itemIndex].cost.dirty = parseNumericFormat(
            locale,
            checkInputs.items[itemIndex].cost.dirty
          ).toString();
          setCheckInputs(newCheckInputs);
          setSelection({
            anchor: e.target,
            column: 1,
            options: [
              {
                color: "error",
                id: "deleteRow",
                label: props.strings["deleteRow"],
                onClick: (e) => {
                  setSelection(null);
                  if (props.writeAccess && typeof props.onItemDelete === "function") {
                    props.onItemDelete(e, itemIndex);
                  }
                },
              },
            ],
            row,
          });
        }
      }, []);

      const handleNameBlur: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onNameBlur === "function") {
          const newCheckInputs = { ...checkInputs };
          const newName = newCheckInputs.items[itemIndex].name;
          if (newName.clean !== newName.dirty) {
            newName.clean = newName.dirty;
            props.onNameBlur(e, itemIndex);
          }
          setCheckInputs(newCheckInputs);
        }
      }, []);

      const handleNameChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onNameChange === "function") {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.items[itemIndex].name.dirty = e.target.value;
          setCheckInputs(newCheckInputs);
          props.onNameChange(e, itemIndex);
        }
      }, []);

      const handleNameFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess) {
          setSelection({
            anchor: e.target,
            column: 0,
            options: [
              {
                color: "error",
                id: "deleteRow",
                label: props.strings["deleteRow"],
                onClick: (e) => {
                  setSelection(null);
                  if (props.writeAccess && typeof props.onItemDelete === "function") {
                    props.onItemDelete(e, itemIndex);
                  }
                },
              },
            ],
            row,
          });
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
            className={`Grid-cell ${nameClassName}`}
            disabled={props.loading || !props.writeAccess}
            onBlur={handleNameBlur}
            onChange={handleNameChange}
            onFocus={handleNameFocus}
            value={checkInputs.items[itemIndex].name.dirty}
          />
          <Input
            aria-labelledby="cost"
            className={`Grid-cell Grid-numeric ${costClassName}`}
            disabled={props.loading || !props.writeAccess}
            onBlur={handleCostBlur}
            onChange={handleCostChange}
            onFocus={handleCostFocus}
            value={checkInputs.items[itemIndex].cost.dirty}
          />
          <Select
            aria-labelledby="buyer"
            className={`Grid-cell ${buyerClassName}`}
            disabled={props.loading || !props.writeAccess}
            onBlur={handleBuyerBlur}
            onChange={handleBuyerChange}
            onFocus={handleBuyerFocus}
            value={checkInputs.items[itemIndex].buyer.dirty}
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

      const handleContributorBlur: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onContributorBlur === "function") {
          const newCheckInputs = { ...checkInputs };
          const newContributor = newCheckInputs.contributors[contributorIndex];
          if (newContributor.clean !== newContributor.dirty) {
            newContributor.clean = newContributor.dirty;
            props.onContributorBlur(e, contributorIndex);
          }
          setCheckInputs(newCheckInputs);
        }
      }, []);

      const handleContributorChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess && typeof props.onContributorChange === "function") {
          const newCheckInputs = { ...checkInputs };
          newCheckInputs.contributors[contributorIndex].dirty = e.target.value;
          setCheckInputs(newCheckInputs);
          props.onContributorChange(e, contributorIndex);
        }
      }, []);

      const handleContributorFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess) {
          setSelection({
            anchor: e.target,
            column,
            options: [
              {
                color: "error",
                id: "deleteColumn",
                label: props.strings["deleteColumn"],
                onClick: (e) => {
                  setSelection(null);
                  // Check for writeAccess to handle access being changed after initial render
                  if (props.writeAccess && typeof props.onContributorDelete === "function") {
                    props.onContributorDelete(e, contributorIndex);
                  }
                },
              },
            ],
            row,
          });
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
          className={`Grid-cell Grid-numeric ${className}`}
          disabled={props.loading || !props.writeAccess}
          key={contributor.id}
          onBlur={handleContributorBlur}
          onChange={handleContributorChange}
          onFocus={handleContributorFocus}
          value={checkInputs.contributors[contributorIndex].dirty}
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

    return (
      <div className={`Grid-container ${props.className}`}>
        <section className="Grid-data" onBlur={handleGridBlur}>
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
