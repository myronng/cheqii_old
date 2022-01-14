import { Button, ButtonProps, ClickAwayListener } from "@mui/material";
import { styled } from "@mui/material/styles";
import { FloatingMenu } from "components/check/FloatingMenu";
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
  MouseEvent,
  useState,
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

export const CheckDisplay = styled((props: CheckDisplayProps) => {
  const router = useRouter();
  const [floatingMenu, setFloatingMenu] = useState<{
    actions: {
      ButtonProps: ButtonProps;
      id: string;
    }[];
    target: EventTarget & (HTMLInputElement | HTMLSelectElement);
  } | null>(null);
  const locale = router.locale ?? router.defaultLocale!;
  const currency = getCurrencyType(locale);
  const contributors = props.contributors ?? [];
  const items = props.items ?? [];
  let totalCost = dinero({ amount: 0, currency });
  const totalPaid = new Map<number, Dinero<number>>();
  const totalOwing = new Map<number, Dinero<number>>();
  const floatingMenuOpen = Boolean(floatingMenu);

  const renderContributors = contributors.map((contributor, contributorIndex) => {
    const contributorId = `contributor-${contributorIndex}`;
    const isActive = floatingMenu?.target.id === contributorId ? "active" : "";

    const handleContributorBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      props.onContributorBlur(e, contributorIndex);
    };

    const handleContributorFocus: FocusEventHandler<HTMLInputElement> = (e) => {
      setFloatingMenu({
        actions: [
          {
            id: "deleteColumn",
            ButtonProps: {
              color: "error",
              onClick: (e) => {
                props.onContributorDelete(e, contributorIndex);
                handleFloatingMenuClose();
              },
            },
          },
        ],
        target: e.currentTarget,
      });
    };

    return (
      <Input
        className={`Grid-cell Grid-numeric ${isActive}`}
        defaultValue={contributor}
        disabled={props.loading}
        id={contributorId}
        key={contributorIndex}
        onBlur={handleContributorBlur}
        onFocus={handleContributorFocus}
        required
      />
    );
  });

  const renderItems = items.map((item, itemIndex) => {
    const nameId = `name-${item.id}`;
    const costId = `cost-${item.id}`;
    const buyerId = `buyer-${item.id}`;
    const isNameActive = floatingMenu?.target.id === nameId ? "active" : "";
    const isCostActive = floatingMenu?.target.id === costId ? "active" : "";
    const isBuyerActive = floatingMenu?.target.id === buyerId ? "active" : "";

    if (typeof item.buyer !== "undefined" && typeof item.cost !== "undefined") {
      const buyerTotalPaid = totalPaid.get(item.buyer) || dinero({ amount: 0, currency });
      totalPaid.set(item.buyer, add(buyerTotalPaid, dinero({ amount: item.cost, currency })));
    }

    if (typeof item.cost !== "undefined") {
      totalCost = add(totalCost, dinero({ amount: item.cost, currency }));
    }

    const splits = item.split ?? [];
    const renderSplit = splits.map((split, splitIndex) => {
      const splitId = `split-${item.id}-${splitIndex}`;
      const isActive = floatingMenu?.target.id === splitId ? "active" : "";

      const handleSplitBlur: FocusEventHandler<HTMLInputElement> = (e) => {
        props.onSplitBlur(e, itemIndex, splitIndex);
      };

      const handleSplitFocus: FocusEventHandler<HTMLInputElement> = (e) => {
        setFloatingMenu({
          actions: [
            {
              id: "deleteRow",
              ButtonProps: {
                color: "error",
                onClick: (e) => {
                  props.onItemDelete(e, itemIndex);
                  handleFloatingMenuClose();
                },
              },
            },
            {
              id: "deleteColumn",
              ButtonProps: {
                color: "error",
                onClick: (e) => {
                  props.onContributorDelete(e, splitIndex);
                  handleFloatingMenuClose();
                },
              },
            },
          ],
          target: e.currentTarget,
        });
      };

      return (
        <Input
          className={`Grid-cell Grid-numeric ${isActive}`}
          defaultValue={split}
          disabled={props.loading}
          id={splitId}
          inputMode="numeric"
          key={`${splitIndex}-${split}`} // Use value and index for re-rendering contributor deletes properly
          numberFormat="integer"
          onBlur={handleSplitBlur}
          onFocus={handleSplitFocus}
          required
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

    const handleItemFocus: FocusEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
      setFloatingMenu({
        actions: [
          {
            id: "deleteRow",
            ButtonProps: {
              color: "error",
              onClick: (e) => {
                props.onItemDelete(e, itemIndex);
                handleFloatingMenuClose();
              },
            },
          },
        ],
        target: e.currentTarget,
      });
    };

    const handleItemNameBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      props.onItemNameBlur(e, itemIndex);
    };

    return (
      <div className="Grid-row" key={item.id}>
        <Input
          className={`Grid-cell ${isNameActive}`}
          defaultValue={item.name}
          disabled={props.loading}
          id={nameId}
          onBlur={handleItemNameBlur}
          onFocus={handleItemFocus}
          required
        />
        <Input
          className={`Grid-cell Grid-numeric ${isCostActive}`}
          defaultValue={item.cost}
          disabled={props.loading}
          id={costId}
          inputMode="numeric"
          numberFormat="currency"
          onBlur={handleCostBlur}
          onFocus={handleItemFocus}
          required
        />
        <Select
          className={`Grid-cell ${isBuyerActive}`}
          defaultValue={item.buyer}
          disabled={props.loading}
          id={buyerId}
          onChange={handleBuyerChange}
          onFocus={handleItemFocus}
          options={contributors}
        />
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

  const handleFloatingMenuClose = () => {
    setFloatingMenu(null);
  };

  return (
    <div className={`Grid-container ${props.className} ${props.loading ? "loading" : ""}`}>
      <ClickAwayListener onClickAway={handleFloatingMenuClose}>
        <section className="Grid-data">
          <div className="Grid-row">
            <span className="Grid-header" onClick={handleFloatingMenuClose}>
              {props.strings["item"]}
            </span>
            <span className="Grid-header Grid-numeric" onClick={handleFloatingMenuClose}>
              {props.strings["cost"]}
            </span>
            <span className="Grid-header" onClick={handleFloatingMenuClose}>
              {props.strings["buyer"]}
            </span>
            {renderContributors}
          </div>
          {renderItems}
          <FloatingMenu
            PopperProps={{
              anchorEl: floatingMenu?.target,
              open: floatingMenuOpen,
            }}
          >
            {floatingMenu?.actions.map((action) => (
              <Button key={action.id} {...action.ButtonProps}>
                {props.strings[action.id]}
              </Button>
            ))}
          </FloatingMenu>
        </section>
      </ClickAwayListener>
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

    &:not(.loading) {
      & .Grid-row {
        &:hover, &:focus-within, &.active {
          & .Grid-cell {
            background: ${theme.palette.action.hover};

            &:hover, &:focus, &.active {
              background: ${theme.palette.action.selected};
            }
          }
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
