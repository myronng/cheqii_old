import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { Dialog, DialogProps } from "components/Dialog";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, CheckDataForm } from "declarations";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { interpolateString } from "services/formatter";
import { parseNumericFormat } from "services/parser";

export type CheckSummaryProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    checkData: CheckDataForm;
    contributorIndex: number;
  };

export const CheckSummary = styled((props: CheckSummaryProps) => {
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale!;
  const currentUserInfo = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const renderItems = props.checkData.items.map((item) => {
    const splitPortions = item.split.reduce(
      (previous, split) => previous + parseNumericFormat(locale, split),
      0
    );

    return (
      <Fragment key={item.id}>
        <div>{item.cost}</div>
        <div>
          {item.split[props.contributorIndex]} / {splitPortions}
        </div>
      </Fragment>
    );
  });

  return (
    <Dialog
      className={`CheckSummary-root ${props.className}`}
      dialogTitle={interpolateString(props.strings["summaryForName"], {
        name: props.checkData.contributors[props.contributorIndex]?.name,
      })}
      fullWidth
      maxWidth="sm"
      onClose={props.onClose}
      open={props.open}
    >
      {renderItems}
    </Dialog>
  );
})`
  ${({ theme }) => `
  `}
`;

CheckSummary.displayName = "CheckSummary";
