import {} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Dialog, DialogProps } from "components/Dialog";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps } from "declarations";
import { useState } from "react";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type CheckSummaryProps = Pick<BaseProps, "className" | "strings"> & DialogProps & {};

export const CheckSummary = styled((props: CheckSummaryProps) => {
  const currentUserInfo = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [inviteTypeMenu, setInviteTypeMenu] = useState<HTMLElement | null>(null);

  return (
    <Dialog
      className={`CheckSummary-root ${props.className}`}
      dialogTitle={props.strings["summary"]}
      fullWidth
      maxWidth="sm"
      onClose={props.onClose}
      open={props.open}
    ></Dialog>
  );
})`
  ${({ theme }) => `
  `}
`;

CheckSummary.displayName = "CheckSummary";
