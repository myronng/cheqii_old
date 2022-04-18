import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { Dialog, DialogProps } from "components/Dialog";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, CheckDataForm } from "declarations";
import { interpolateString } from "services/formatter";

export type CheckSummaryProps = Pick<BaseProps, "className" | "strings"> &
  DialogProps & {
    checkData: CheckDataForm;
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
        name: props.checkData.contributors[props.currentContributor]?.name.dirty,
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
