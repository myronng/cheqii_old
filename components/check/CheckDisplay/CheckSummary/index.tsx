import { Divider } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { ItemPaymentMap, PaymentMap } from "components/check/CheckDisplay";
import { Dialog, DialogProps } from "components/Dialog";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, CheckDataForm } from "declarations";
import { dinero, subtract } from "dinero.js";
import { useRouter } from "next/router";
import { Fragment, memo } from "react";
import { formatCurrency, interpolateString } from "services/formatter";
import { getCurrencyType } from "services/locale";
import {
  parseCurrencyAmount,
  parseDineroAmount,
  parseDineroMap,
  parseNumericFormat,
  parseRatioAmount,
} from "services/parser";

export type CheckSummaryProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    checkData: CheckDataForm;
    contributorIndex: number;
    itemOwing: ItemPaymentMap;
    totalOwing: PaymentMap;
    totalPaid: PaymentMap;
  };

export const CheckSummary = styled(
  memo((props: CheckSummaryProps) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const currency = getCurrencyType(locale);
    // const currentUserInfo = useAuth();
    // const { loading, setLoading } = useLoading();
    // const { setSnackbar } = useSnackbar();
    const zero = dinero({ amount: 0, currency });
    const totalPaid = props.totalPaid.get(props.contributorIndex) ?? zero;
    const totalPaidAmount = parseDineroAmount(totalPaid);
    const totalOwing = props.totalOwing.get(props.contributorIndex) ?? zero;
    const totalOwingAmount = parseDineroAmount(totalOwing);
    let renderResult,
      renderOwing = null,
      renderPaid = null;
    // TODO: Only re-render grid-rows that are changed

    if (totalPaidAmount > 0 || totalOwingAmount > 0) {
      const balanceAmount = parseDineroAmount(subtract(totalPaid, totalOwing));
      const negativeClass = balanceAmount < 0 ? "Grid-negative" : "";
      const [renderItemsPaid, renderItemsOwing] = props.checkData.items.reduce<JSX.Element[][]>(
        (acc, item, itemIndex) => {
          const itemOwing = props.itemOwing.get(itemIndex);
          const splitPortions = item.split.reduce(
            (previous, split) => previous + parseNumericFormat(locale, split),
            0
          );
          if (typeof itemOwing !== "undefined") {
            const contributorSplit = parseRatioAmount(locale, item.split[props.contributorIndex]);
            // Remove item instead of adding as a voided item if cost === 0; would be irrelevant to user
            if (contributorSplit > 0) {
              const owingItemCost = parseDineroAmount(
                parseDineroMap(currency, itemOwing, props.contributorIndex)
              );
              const voidClass = owingItemCost === 0 ? "Grid-void" : "";
              acc[1].push(
                <Fragment key={item.id}>
                  <div className={voidClass}>{item.name}</div>
                  <div className={`Grid-description Grid-numeric ${voidClass}`}>{item.cost}</div>
                  <div className={`Grid-description ${voidClass}`}>
                    {props.strings["multiplicationSign"]}
                  </div>
                  <div className={`Grid-description ${voidClass}`}>
                    {interpolateString(props.strings["division"], {
                      dividend: splitPortions.toString(),
                      divisor: item.split[props.contributorIndex],
                    })}
                  </div>
                  <div className={`Grid-description ${voidClass}`}>
                    {props.strings["equalsSign"]}
                  </div>
                  <div className={`Grid-numeric ${voidClass}`}>
                    {formatCurrency(locale, owingItemCost)}
                  </div>
                </Fragment>
              );
            }
          }

          if (item.buyer === props.contributorIndex) {
            const voidClass =
              splitPortions === 0 || parseCurrencyAmount(locale, currency, item.cost) === 0
                ? "Grid-void"
                : "";
            acc[0].push(
              <Fragment key={item.id}>
                <div className={voidClass}>{item.name}</div>
                <div className={`Grid-numeric ${voidClass}`}>{item.cost}</div>
              </Fragment>
            );
          }

          return acc;
        },
        [[], []]
      );

      if (totalPaidAmount > 0) {
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
      if (totalOwingAmount > 0) {
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
      renderResult = (
        <>
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
    } else {
      renderResult = props.strings["nothingToSeeHere"];
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
  })
)`
  ${({ theme }) => `
    & .CheckSummary-balance {
      display: grid;
      gap: ${theme.spacing(1, 2)};
      grid-template-columns: 1fr min-content;
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
