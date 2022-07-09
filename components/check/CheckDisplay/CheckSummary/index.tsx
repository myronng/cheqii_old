import { Divider, FormControlLabel, Switch, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ItemPaymentMap, PaymentMap } from "components/check/CheckDisplay";
import { Loader } from "components/check/CheckDisplay/CheckSummary/Loader";
import { Dialog, DialogProps } from "components/Dialog";
import { BaseProps, CheckDataForm, ItemForm } from "declarations";
import { dinero, subtract } from "dinero.js";
import { useRouter } from "next/router";
import { ChangeEventHandler, Fragment, memo, useState } from "react";
import { formatCurrency, interpolateString } from "services/formatter";
import { getCurrencyType } from "services/locale";
import {
  parseCurrencyAmount,
  parseDineroAmount,
  parseDineroMap,
  parseNumericFormat,
  parseRatioAmount,
} from "services/parser";

type CreateOwingItem = (
  className: string,
  strings: BaseProps["strings"],
  item: ItemForm,
  contributorIndex: number,
  splitPortions: string,
  owingItemCost: string
) => JSX.Element;

type CreatePaidItem = (className: string, item: ItemForm) => JSX.Element;

export type CheckSummaryProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    checkData: CheckDataForm;
    contributorIndex: number;
    itemOwing: ItemPaymentMap;
    totalOwing: PaymentMap;
    totalPaid: PaymentMap;
  };

const createOwingItem: CreateOwingItem = (
  className,
  strings,
  item,
  contributorIndex,
  splitPortions,
  owingItemCost
) => (
  <Fragment key={item.id}>
    <div className={className}>{item.name}</div>
    <div className={`Grid-description Grid-numeric ${className}`}>{item.cost}</div>
    <div className={`Grid-description ${className}`}>{strings["multiplicationSign"]}</div>
    <div className={`Grid-description ${className}`}>
      {interpolateString(strings["division"], {
        dividend: splitPortions.toString(),
        divisor: item.split[contributorIndex],
      })}
    </div>
    <div className={`Grid-description ${className}`}>{strings["equalsSign"]}</div>
    <div className={`Grid-numeric ${className}`}>{owingItemCost}</div>
  </Fragment>
);

const createPaidItem: CreatePaidItem = (className, item) => (
  <Fragment key={item.id}>
    <div className={className}>{item.name}</div>
    <div className={`Grid-numeric ${className}`}>{item.cost}</div>
  </Fragment>
);

const CheckSummaryUnstyled = memo((props: CheckSummaryProps) => {
  const router = useRouter();
  const [showVoid, setShowVoid] = useState(false);
  let renderResult = null;

  if (props.contributorIndex > -1) {
    let renderOwing = null,
      renderPaid = null;
    const locale = router.locale ?? router.defaultLocale!;
    const currency = getCurrencyType(locale);
    const zero = dinero({ amount: 0, currency });
    const totalPaid = props.totalPaid.get(props.contributorIndex) ?? zero;
    const totalPaidAmount = parseDineroAmount(totalPaid);
    const totalOwing = props.totalOwing.get(props.contributorIndex) ?? zero;
    const totalOwingAmount = parseDineroAmount(totalOwing);
    const balanceAmount = parseDineroAmount(subtract(totalPaid, totalOwing));
    const negativeClass = balanceAmount < 0 ? "Grid-negative" : "";
    const [renderItemsPaid, renderItemsOwing] = props.checkData.items.reduce<JSX.Element[][]>(
      (acc, item, itemIndex) => {
        const itemOwing = props.itemOwing.get(itemIndex);
        const splitPortions = item.split.reduce(
          (previous, split) => previous + parseNumericFormat(locale, split),
          0
        );
        const itemCost = parseCurrencyAmount(locale, currency, item.cost);
        // Owing items
        if (typeof itemOwing !== "undefined") {
          const contributorSplit = parseRatioAmount(locale, item.split[props.contributorIndex]);
          if (contributorSplit > 0) {
            const owingItemCost = parseDineroAmount(
              parseDineroMap(currency, itemOwing, props.contributorIndex)
            );
            // Remove item instead of adding as a voided item if cost === 0; would be irrelevant to user
            if (owingItemCost === 0) {
              if (showVoid) {
                acc[1].push(
                  createOwingItem(
                    "Grid-void",
                    props.strings,
                    item,
                    props.contributorIndex,
                    splitPortions.toString(),
                    formatCurrency(locale, owingItemCost)
                  )
                );
              }
            } else {
              acc[1].push(
                createOwingItem(
                  "",
                  props.strings,
                  item,
                  props.contributorIndex,
                  splitPortions.toString(),
                  formatCurrency(locale, owingItemCost)
                )
              );
            }
          }
        }

        // Paid items
        if (item.buyer === props.contributorIndex) {
          if (splitPortions === 0 || itemCost === 0) {
            if (showVoid) {
              acc[0].push(createPaidItem("Grid-void", item));
            }
          } else {
            acc[0].push(createPaidItem("", item));
          }
        }

        return acc;
      },
      [[], []]
    );

    const hasPaidItems = renderItemsPaid.length > 0;
    const hasOwingItems = renderItemsOwing.length > 0;

    if (hasPaidItems) {
      renderPaid = (
        <section className="CheckSummary-paid CheckSummarySection-root">
          <div className="Grid-header">{props.strings["paidItems"]}</div>
          <div className="Grid-header Grid-numeric Grid-wide">{props.strings["cost"]}</div>
          {renderItemsPaid}
          <Divider className="Grid-divider" />
          <div className="Grid-total Grid-wide">{props.strings["totalPaid"]}</div>
          <div className="Grid-numeric">{formatCurrency(locale, totalPaidAmount)}</div>
        </section>
      );
    }
    if (hasOwingItems) {
      renderOwing = (
        <section className="CheckSummary-owing CheckSummarySection-root">
          <div className="Grid-header">{props.strings["owingItems"]}</div>
          <div className="Grid-header Grid-numeric Grid-wide">{props.strings["cost"]}</div>
          {renderItemsOwing}
          <Divider className="Grid-divider" />
          <div className="Grid-total Grid-wide">{props.strings["totalOwing"]}</div>
          <div className="Grid-numeric">{formatCurrency(locale, totalOwingAmount)}</div>
        </section>
      );
    }
    if (hasPaidItems || hasOwingItems) {
      const handleVoidSwitchChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        setShowVoid(e.target.checked);
      };

      renderResult = (
        <>
          <section className="CheckSummary-options">
            <FormControlLabel
              control={<Switch checked={showVoid} onChange={handleVoidSwitchChange} />}
              label={props.strings["showVoidedItems"]}
            />
          </section>
          {renderPaid}
          {renderOwing}
          <section className="CheckSummary-balance CheckSummarySection-root">
            <div className="Grid-header">{props.strings["balance"]}</div>
            <div className={`Grid-numeric ${negativeClass}`}>
              {formatCurrency(locale, balanceAmount)}
            </div>
          </section>
        </>
      );
    }
  }
  if (renderResult === null) {
    renderResult = (
      <div className="CheckSummary-empty">
        <Loader />
        <Typography>{props.strings["nothingToSeeHere"]}</Typography>
      </div>
    );
  }

  return (
    <Dialog
      className={`CheckSummary-root ${props.className}`}
      dialogTitle={props.checkData.contributors[props.contributorIndex]?.name}
      onClose={props.onClose}
      open={props.open}
    >
      {renderResult}
    </Dialog>
  );
});

export const CheckSummary = styled(CheckSummaryUnstyled)`
  ${({ theme }) => `
    & .CheckSummary-balance {
      display: grid;
      gap: ${theme.spacing(1, 2)};
      grid-template-columns: 1fr min-content;
    }

    & .CheckSummary-empty {
      align-items: center;
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(8)};
      justify-content: center;

      ${theme.breakpoints.down("sm")} {
        flex: 1;
      }

      ${theme.breakpoints.up("sm")} {
        min-height: 256px;
        min-width: 256px;
      }
    }

    & .CheckSummary-options {
      display: flex;
    }

    & .CheckSummary-owing {
      display: grid;
      gap: ${theme.spacing(1, 2)};
      grid-template-columns: 1fr min-content min-content max-content min-content min-content;
    }

    & .CheckSummary-paid {
      display: grid;
      gap: ${theme.spacing(1, 2)};
      grid-template-columns: 1fr min-content;
    }

    & .CheckSummarySection-root {
      background: ${theme.palette.action.hover};
      border-radius: ${theme.shape.borderRadius}px;
      font-family: Fira Code;
      padding: ${theme.spacing(2, 3)}
    }

    & .Grid-description {
      color: ${theme.palette.text.disabled};
    }

    & .Grid-divider {
      grid-column: 1 / -1;
      margin: ${theme.spacing(1, 0)};
    }

    & .Grid-header {
      color: ${theme.palette.text.disabled};
      white-space: nowrap;

      &.Grid-wide {
        grid-column: 2 / -1;
      }
    }

    & .Grid-negative {
      color: ${theme.palette.error.main};
    }

    & .Grid-numeric {
      text-align: right;
    }

    & .Grid-total {
      color: ${theme.palette.text.disabled};

      &.Grid-wide {
        grid-column: 1 / -2;
      }
    }

    & .Grid-void {
      color: ${theme.palette.action.disabled}; // Differentiate from descriptions
    }

    & .MuiDialogContent-root {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
    }
  `}
`;

CheckSummary.displayName = "CheckSummary";
CheckSummaryUnstyled.displayName = "CheckSummaryUnstyled";
