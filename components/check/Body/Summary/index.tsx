import { ContentCopy, Edit, InfoOutlined, Link, LinkOff } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Button, Divider, FormControlLabel, Switch, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { ItemPaymentMap, PaymentMap } from "components/check/Body";
import { Loader } from "components/check/Body/Summary/Loader";
import { Dialog, DialogProps } from "components/Dialog";
import { LinkButton } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, CheckDataForm, CheckUsers, ItemForm } from "declarations";
import { dinero, subtract } from "dinero.js";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { ChangeEventHandler, Dispatch, Fragment, memo, SetStateAction, useState } from "react";
import { db, getUniqueId } from "services/firebase";
import { formatCurrency, interpolateString } from "services/formatter";
import { getCurrencyType } from "services/locale";
import {
  parseCurrencyAmount,
  parseDineroAmount,
  parseDineroMap,
  parseNumericFormat,
  parseRatioAmount,
} from "services/parser";
import { checkDataToCheck } from "services/transformer";

type CreateOwingItem = (
  className: string,
  strings: BaseProps["strings"],
  item: ItemForm,
  contributorIndex: number,
  splitPortions: string,
  owingItemCost: string
) => JSX.Element;

type CreatePaidItem = (className: string, item: ItemForm) => JSX.Element;

export type SummaryProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    checkData: CheckDataForm;
    checkId: string;
    checkUsers: CheckUsers;
    contributorIndex: number;
    itemOwing: ItemPaymentMap;
    setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
    totalOwing: PaymentMap;
    totalPaid: PaymentMap;
    writeAccess: boolean;
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

const SummaryUnstyled = memo((props: SummaryProps) => {
  const router = useRouter();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const { userInfo } = useAuth();
  const [showVoid, setShowVoid] = useState(false);
  const locale = router.locale ?? router.defaultLocale!;
  const currency = getCurrencyType(locale);
  let renderResult = null;
  let renderPayments;
  const contributor = props.checkData.contributors[props.contributorIndex];

  const checkUser = props.checkUsers[contributor?.id];
  if (typeof checkUser !== "undefined") {
    // Is already linked
    const checkUserPayment = checkUser.payment;
    let renderWallet;
    let renderPaymentsButtons;

    if (userInfo.uid === contributor.id) {
      // Only show unlink button if current user is selected
      const handleUnlinkPaymentsClick = async () => {
        try {
          if (props.writeAccess) {
            const newContributors = [...props.checkData.contributors];
            newContributors[props.contributorIndex].id = getUniqueId();
            const newStateCheckData = {
              items: props.checkData.items,
              contributors: newContributors,
            };
            const checkDoc = doc(db, "checks", props.checkId);
            const docCheckData = checkDataToCheck(newStateCheckData, locale, currency);
            updateDoc(checkDoc, {
              ...docCheckData,
              updatedAt: Date.now(),
            });
            props.setCheckData(newStateCheckData);
          } else {
            try {
              setLoading({
                active: true,
                id: "unlinkPaymentsSubmit",
              });
              await fetch(`/api/check/${router.query.checkId}/contributor/${contributor.id}`, {
                method: "DELETE",
              });
              // Don't need to update state, will be handled by onSnapshot subscription
            } catch (err) {
              setSnackbar({
                active: true,
                message: err,
                type: "error",
              });
            } finally {
              setLoading({
                active: false,
                id: "unlinkPaymentsSubmit",
              });
            }
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      };

      renderPaymentsButtons = (
        <div className="SummaryPayment-actions">
          <LoadingButton
            disabled={loading.active}
            loading={loading.queue.includes("unlinkPaymentsSubmit")}
            onClick={handleUnlinkPaymentsClick}
            startIcon={<LinkOff />}
            variant="outlined"
          >
            {props.strings["unlinkPayments"]}
          </LoadingButton>
          <LinkButton
            NextLinkProps={{ href: "/settings#payments" }}
            startIcon={<Edit />}
            variant="outlined"
          >
            {props.strings["editPayments"]}
          </LinkButton>
        </div>
      );
    }

    if (typeof checkUserPayment !== "undefined") {
      // Only show payment details if exists
      const handleCopyClick = () => {
        navigator.clipboard.writeText(checkUserPayment.id);
        setSnackbar({
          active: true,
          message: props.strings["copiedToClipboard"],
          type: "success",
        });
      };
      renderWallet = (
        <div className="Summary-wallet">
          <span>
            {interpolateString(props.strings["descriptor"], {
              descriptor: props.strings[checkUserPayment.type],
            })}
          </span>
          <Button
            disabled={loading.active}
            endIcon={<ContentCopy />}
            onClick={handleCopyClick}
            size="small"
          >
            {checkUserPayment.id}
          </Button>
        </div>
      );
    } else {
      // Show hint to update settings to get payment ID
      renderWallet = (
        <div className="Summary-hint">
          <InfoOutlined />
          <span>{props.strings["walletMissingHint"]}</span>
        </div>
      );
    }
    renderPayments = (
      <div className="SummaryPayment-root">
        {renderPaymentsButtons}
        {renderWallet}
      </div>
    );
  } else {
    // Selected user is not linked yet
    // Disable link button if anonymous user
    const isDisabled = !userInfo.isAnonymous ? loading.active : true;
    const previousContributorIndex = props.checkData.contributors.findIndex(
      (contributor) => contributor.id === userInfo.uid
    );
    let renderLinkPaymentsHint;

    const handleLinkPaymentsClick = async () => {
      try {
        if (!isDisabled) {
          if (props.writeAccess) {
            const newContributors = [...props.checkData.contributors];

            if (userInfo.uid) {
              // Unlink previous contributor ID if exists
              if (previousContributorIndex > -1) {
                newContributors[previousContributorIndex].id = getUniqueId();
              }

              // Link to new contributor ID
              newContributors[props.contributorIndex].id = userInfo.uid;
            }
            const newStateCheckData = {
              items: props.checkData.items,
              contributors: newContributors,
            };
            const checkDoc = doc(db, "checks", props.checkId);
            const docCheckData = checkDataToCheck(newStateCheckData, locale, currency);
            updateDoc(checkDoc, {
              ...docCheckData,
              updatedAt: Date.now(),
            });
            props.setCheckData(newStateCheckData);
          } else {
            try {
              setLoading({
                active: true,
                id: "linkPaymentsSubmit",
              });
              await fetch(`/api/check/${router.query.checkId}/contributor/${contributor.id}`, {
                method: "POST",
              });
              // Don't need to update state, will be handled by onSnapshot subscription
            } catch (err) {
              setSnackbar({
                active: true,
                message: err,
                type: "error",
              });
            } finally {
              setLoading({
                active: false,
                id: "linkPaymentsSubmit",
              });
            }
          }
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    };

    if (userInfo.isAnonymous) {
      renderLinkPaymentsHint = (
        <div className="Summary-hint">
          <InfoOutlined />
          <span>{props.strings["linkPaymentsAnonymousHint"]}</span>
        </div>
      );
    } else if (previousContributorIndex > -1) {
      renderLinkPaymentsHint = (
        <div className="Summary-hint">
          <InfoOutlined />
          <span>
            {interpolateString(props.strings["linkPaymentsSwitchHint"], {
              previousContributor: props.checkData.contributors[previousContributorIndex].name,
            })}
          </span>
        </div>
      );
    }

    renderPayments = (
      <div className="SummaryPayment-root">
        <LoadingButton
          disabled={isDisabled}
          loading={loading.queue.includes("linkPaymentsSubmit")}
          onClick={handleLinkPaymentsClick}
          startIcon={<Link />}
          variant="outlined"
        >
          {props.strings["linkPayments"]}
        </LoadingButton>
        {renderLinkPaymentsHint}
      </div>
    );
  }

  if (props.contributorIndex > -1) {
    let renderOwing = null,
      renderPaid = null;
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
        <section className="Summary-paid SummarySection-root">
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
        <section className="Summary-owing SummarySection-root">
          <div className="Grid-header">{props.strings["owingItems"]}</div>
          <div className="Grid-header Grid-numeric Grid-wide">{props.strings["cost"]}</div>
          {renderItemsOwing}
          <Divider className="Grid-divider" />
          <div className="Grid-total Grid-wide">{props.strings["totalOwing"]}</div>
          <div className="Grid-numeric">{formatCurrency(locale, totalOwingAmount)}</div>
        </section>
      );
    }
    const handleVoidSwitchChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      setShowVoid(e.target.checked);
    };

    renderResult = (
      <>
        <section className="Summary-options">
          {renderPayments}
          <FormControlLabel
            control={<Switch checked={showVoid} onChange={handleVoidSwitchChange} />}
            label={props.strings["showVoidedItems"]}
          />
        </section>
        {renderPaid}
        {renderOwing}
        <section className="Summary-balance SummarySection-root">
          <div className="Grid-header">{props.strings["balance"]}</div>
          <div className={`Grid-numeric ${negativeClass}`}>
            {formatCurrency(locale, balanceAmount)}
          </div>
        </section>
      </>
    );
  }

  // Legacy view, should never be reached but will be used as a failsafe
  if (renderResult === null) {
    renderResult = (
      <>
        {renderPayments}
        <div className="Summary-empty">
          <Loader />
          <Typography>{props.strings["nothingToSeeHere"]}</Typography>
        </div>
      </>
    );
  }

  return (
    <Dialog
      className={`Summary-root ${props.className}`}
      dialogTitle={contributor?.name}
      fullWidth
      onClose={props.onClose}
      open={props.open}
    >
      {renderResult}
    </Dialog>
  );
});

export const Summary = styled(SummaryUnstyled)`
  ${({ theme }) => `
    & .Summary-balance {
      display: grid;
      gap: ${theme.spacing(1, 2)};
      grid-template-columns: 1fr min-content;
    }

    & .Summary-empty {
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

    & .Summary-hint {
      display: flex;
      color: ${theme.palette.text.disabled};
      gap: ${theme.spacing(1)};
    }

    & .Summary-options {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
    }

    & .Summary-owing {
      display: grid;
      gap: ${theme.spacing(1, 2)};
      grid-template-columns: 1fr min-content min-content max-content min-content min-content;
    }

    & .Summary-paid {
      display: grid;
      gap: ${theme.spacing(1, 2)};
      grid-template-columns: 1fr min-content;
    }

    & .SummaryPayment-actions {
      display: flex;
      gap: ${theme.spacing(2)};

      & .MuiButtonBase-root {
        flex: 1;
        text-align: left; // Used for mobile viewports wrapping text
      }
    }

    & .SummaryPayment-root {
      border: 2px solid ${theme.palette.secondary[theme.palette.mode]};
      border-radius: ${theme.shape.borderRadius}px;
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(2)}
    }

    & .SummarySection-root {
      background: ${theme.palette.action.hover};
      border-radius: ${theme.shape.borderRadius}px;
      font-family: Fira Code;
      flex-shrink: 0; // Fixes overflow-y scrollbars showing
      overflow-x: auto;
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

Summary.displayName = "Summary";
SummaryUnstyled.displayName = "SummaryUnstyled";
