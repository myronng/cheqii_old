import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Dialog, DialogProps } from "components/Dialog";
import { BaseProps, Check } from "declarations";
import { useState } from "react";
import { interpolateString } from "services/formatter";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckSummaryProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    checkData: Check;
    currentContributor: number;
  };

export const CheckSummary = styled((props: CheckSummaryProps) => {
  const currentUserInfo = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();

  return (
    <Dialog
      className={`CheckSummary-root ${props.className}`}
      dialogTitle={interpolateString(props.strings["summaryForName"], {
        name: props.checkData.contributors[props.currentContributor]?.name,
      })}
      fullWidth
      maxWidth="sm"
      onClose={props.onClose}
      open={props.open}
    >
      <div></div>
    </Dialog>
  );
})`
  ${({ theme }) => `
  `}
`;

CheckSummary.displayName = "CheckSummary";
