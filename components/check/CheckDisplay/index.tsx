import { Button, Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FloatingMenu, FloatingMenuOption } from "components/check/CheckDisplay/FloatingMenu";
import { Input } from "components/check/CheckDisplay/Input";
import { Select } from "components/check/CheckDisplay/Select";
import { BaseProps, CheckDataForm } from "declarations";
import { add, allocate, Dinero, dinero, subtract } from "dinero.js";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import {
  ChangeEventHandler,
  Dispatch,
  FocusEventHandler,
  forwardRef,
  Fragment,
  SetStateAction,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { db } from "services/firebase";
import { formatCurrency, formatInteger } from "services/formatter";
import { getCurrencyType } from "services/locale";
import {
  isNumber,
  isNumericFormat,
  parseCurrencyAmount,
  parseDineroAmount,
  parseDineroMap,
  parseNumericFormat,
  parseRatioAmount,
} from "services/parser";
import { checkDataToCheck } from "services/transformer";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckDisplayProps = Pick<BaseProps, "className" | "strings"> & {
  checkData: CheckDataForm;
  checkId: string;
  loading: boolean;
  onContributorSummaryClick: (index: number) => void;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
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
    const { setSnackbar } = useSnackbar();
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

    const renderBuyerOptions: JSX.Element[] = [];
    const renderContributors: JSX.Element[] = [];

    const renderItems = props.checkData.items.map((item, itemIndex) => {
      const itemId = item.id;
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

        const handleSplitBlur: FocusEventHandler<HTMLInputElement> = useCallback(async () => {
          try {
            if (props.writeAccess) {
              const rawValue = parseRatioAmount(
                locale,
                props.checkData.items[itemIndex].split[splitIndex].dirty
              );
              const stateCheckData = { ...props.checkData };
              stateCheckData.items[itemIndex].split[splitIndex].dirty = formatInteger(
                locale,
                rawValue
              );

              if (
                stateCheckData.items[itemIndex].split[splitIndex].clean !==
                stateCheckData.items[itemIndex].split[splitIndex].dirty
              ) {
                stateCheckData.items[itemIndex].split[splitIndex].clean =
                  stateCheckData.items[itemIndex].split[splitIndex].dirty;
                const checkDoc = doc(db, "checks", props.checkId);
                const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
                updateDoc(checkDoc, {
                  items: docCheckData.items,
                  updatedAt: Date.now(),
                });
              }
              props.setCheckData(stateCheckData);
            }
          } catch (err) {
            setSnackbar({
              active: true,
              message: err,
              type: "error",
            });
          }
        }, []);

        const handleSplitChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
          const value = e.target.value;
          if (props.writeAccess && isNumericFormat(locale, value, ["group", "literal"])) {
            const stateCheckData = { ...props.checkData };
            stateCheckData.items[itemIndex].split[splitIndex].dirty = e.target.value;
            props.setCheckData(stateCheckData);
          }
        }, []);

        const handleSplitFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
          if (props.writeAccess) {
            const stateCheckData = { ...props.checkData };
            stateCheckData.items[itemIndex].split[splitIndex].dirty = parseRatioAmount(
              locale,
              e.target.value
            ).toString();
            props.setCheckData(stateCheckData);
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
            key={`${itemId}-${contributorId}`}
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

      const handleBuyerBlur: FocusEventHandler<HTMLSelectElement> = useCallback(async () => {
        try {
          if (
            props.writeAccess &&
            props.checkData.items[itemIndex].buyer.clean !==
              props.checkData.items[itemIndex].buyer.dirty
          ) {
            const stateCheckData = { ...props.checkData };
            stateCheckData.items[itemIndex].buyer.clean =
              stateCheckData.items[itemIndex].buyer.dirty;

            const checkDoc = doc(db, "checks", props.checkId);
            const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
            updateDoc(checkDoc, {
              items: docCheckData.items,
              updatedAt: Date.now(),
            });

            props.setCheckData(stateCheckData);
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      }, []);

      const handleBuyerChange: ChangeEventHandler<HTMLSelectElement> = useCallback((e) => {
        if (props.writeAccess) {
          const stateCheckData = { ...props.checkData };
          stateCheckData.items[itemIndex].buyer.dirty = e.target.selectedIndex;
          props.setCheckData(stateCheckData);
        }
      }, []);

      const handleCostBlur: FocusEventHandler<HTMLInputElement> = useCallback(async () => {
        try {
          if (props.writeAccess) {
            const rawValue = parseCurrencyAmount(
              locale,
              currency,
              props.checkData.items[itemIndex].cost.dirty
            );
            const stateCheckData = { ...props.checkData };
            stateCheckData.items[itemIndex].cost.dirty = formatCurrency(locale, rawValue);

            if (
              stateCheckData.items[itemIndex].cost.clean !==
              stateCheckData.items[itemIndex].cost.dirty
            ) {
              stateCheckData.items[itemIndex].cost.clean =
                stateCheckData.items[itemIndex].cost.dirty;
              const checkDoc = doc(db, "checks", props.checkId);
              const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
              updateDoc(checkDoc, {
                items: docCheckData.items,
                updatedAt: Date.now(),
              });
            }

            props.setCheckData(stateCheckData);
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      }, []);

      const handleCostChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        const value = e.target.value;
        if (
          props.writeAccess &&
          isNumericFormat(locale, value, ["currency", "group", "decimal", "literal"])
        ) {
          const stateCheckData = { ...props.checkData };
          stateCheckData.items[itemIndex].cost.dirty = e.target.value;
          props.setCheckData(stateCheckData);
        }
      }, []);

      const handleCostFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess) {
          const stateCheckData = { ...props.checkData };
          stateCheckData.items[itemIndex].cost.dirty = parseNumericFormat(
            locale,
            e.target.value
          ).toString();
          props.setCheckData(stateCheckData);
        }
      }, []);

      const handleNameBlur: FocusEventHandler<HTMLInputElement> = useCallback(async () => {
        try {
          if (
            props.writeAccess &&
            props.checkData.items[itemIndex].name.clean !==
              props.checkData.items[itemIndex].name.dirty
          ) {
            const stateCheckData = { ...props.checkData };
            stateCheckData.items[itemIndex].name.clean = stateCheckData.items[itemIndex].name.dirty;

            const checkDoc = doc(db, "checks", props.checkId);
            const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
            updateDoc(checkDoc, {
              items: docCheckData.items,
              updatedAt: Date.now(),
            });

            props.setCheckData(stateCheckData);
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      }, []);

      const handleNameChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess) {
          const stateCheckData = { ...props.checkData };
          stateCheckData.items[itemIndex].name.dirty = e.target.value;
          props.setCheckData(stateCheckData);
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
        <Fragment key={itemId}>
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
            {renderBuyerOptions}
          </Select>
          {renderSplit}
        </Fragment>
      );
    });

    const renderTotals = props.checkData.contributors.map((contributor, contributorIndex) => {
      const contributorId = contributor.id;
      renderBuyerOptions.push(
        <option className="Select-option" key={contributorId} value={contributorIndex}>
          {contributor.name.dirty}
        </option>
      );
      const column = contributorIndex + 3;
      const row = 0;

      const handleContributorBlur: FocusEventHandler<HTMLInputElement> = useCallback(async () => {
        try {
          if (
            props.writeAccess &&
            props.checkData.contributors[contributorIndex].name.clean !==
              props.checkData.contributors[contributorIndex].name.dirty
          ) {
            const stateCheckData = { ...props.checkData };
            stateCheckData.contributors[contributorIndex].name.clean =
              stateCheckData.contributors[contributorIndex].name.dirty;

            const checkDoc = doc(db, "checks", props.checkId);
            const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
            updateDoc(checkDoc, {
              contributors: docCheckData.contributors,
              updatedAt: Date.now(),
            });

            props.setCheckData(stateCheckData);
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      }, []);

      const handleContributorChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
        if (props.writeAccess) {
          const stateCheckData = { ...props.checkData };
          stateCheckData.contributors[contributorIndex].name.dirty = e.target.value;
          props.setCheckData(stateCheckData);
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
          key={contributorId}
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
          key={contributorId}
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
          const itemIndex = row - 1;
          floatingMenuOptions.push({
            color: "error",
            id: "deleteRow",
            label: props.strings["deleteRow"],
            onClick: async () => {
              try {
                setSelection(null);

                if (props.writeAccess) {
                  const stateCheckData = { ...props.checkData };
                  stateCheckData.items = props.checkData.items.filter(
                    (_value, filterIndex) => filterIndex !== itemIndex
                  );

                  const checkDoc = doc(db, "checks", props.checkId);
                  const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
                  updateDoc(checkDoc, {
                    items: docCheckData.items,
                    updatedAt: Date.now(),
                  });

                  props.setCheckData(stateCheckData);
                }
              } catch (err) {
                setSnackbar({
                  active: true,
                  message: err,
                  type: "error",
                });
              }
            },
          });
        }
        // Account for item name, cost, and buyer columns
        if (column >= 3) {
          const contributorIndex = column - 3;
          floatingMenuOptions.push({
            color: "error",
            id: "deleteColumn",
            label: props.strings["deleteColumn"],
            onClick: async () => {
              try {
                setSelection(null);

                // Check for writeAccess to handle access being changed after initial render
                if (props.writeAccess) {
                  const stateCheckData = { ...props.checkData };
                  stateCheckData.contributors = props.checkData.contributors.filter(
                    (_value, contributorFilterIndex) => contributorFilterIndex !== contributorIndex
                  );
                  stateCheckData.items = props.checkData.items.map((item) => {
                    const newItem = { ...item };
                    if (item.buyer.dirty === contributorIndex) {
                      newItem.buyer.clean = 0;
                      newItem.buyer.dirty = 0;
                    }
                    const newSplit = item.split.filter(
                      (_value, splitFilterIndex) => splitFilterIndex !== contributorIndex
                    );
                    newItem.split = newSplit;

                    return newItem;
                  });

                  const checkDoc = doc(db, "checks", props.checkId);
                  const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
                  updateDoc(checkDoc, {
                    contributors: docCheckData.contributors,
                    items: docCheckData.items,
                    updatedAt: Date.now(),
                  });

                  props.setCheckData(stateCheckData);
                }
              } catch (err) {
                setSnackbar({
                  active: true,
                  message: err,
                  type: "error",
                });
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
