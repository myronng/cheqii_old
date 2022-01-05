import { Close } from "@mui/icons-material";
import {
  Dialog as MuiDialog,
  DialogActions,
  DialogContent,
  DialogProps as MuiDialogProps,
  DialogTitle,
  IconButton,
  Slide,
  SlideProps,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { Styles } from "declarations";
import { forwardRef, MouseEventHandler, ReactNode } from "react";
import { useLoading } from "utilities/LoadingContextProvider";

export interface DialogProps extends MuiDialogProps {
  dialogActions?: ReactNode;
  dialogTitle?: ReactNode;
  onClose?: (
    event: {},
    reason: "actionClick" | "backdropClick" | "closeClick" | "escapeKeyDown"
  ) => void;
}

export const Dialog = styled(
  ({ children, dialogActions, fullScreen, onClose, dialogTitle, ...props }: DialogProps) => {
    const theme = useTheme();
    const { loading } = useLoading();
    const mobileLayout = useMediaQuery(theme.breakpoints.down("sm"));
    const windowed = fullScreen ?? mobileLayout;
    const Transition = windowed ? DialogTransition : undefined;

    const handleClose: DialogProps["onClose"] = (e, reason) => {
      if (
        typeof onClose === "function" &&
        (!loading.active || (loading.active && reason === "actionClick"))
      ) {
        onClose(e, reason);
      }
    };

    const handleCloseClick: MouseEventHandler<HTMLButtonElement> = (e) => {
      if (typeof onClose === "function") {
        onClose(e, "closeClick");
      }
    };

    const renderActions = dialogActions ? (
      <DialogActions>{dialogActions}</DialogActions>
    ) : undefined;

    const renderTitle = dialogTitle ? (
      <DialogTitle>
        <Typography component="span" noWrap variant="h5">
          {dialogTitle}
        </Typography>
        <IconButton
          aria-label="close"
          disabled={loading.active}
          edge="end"
          onClick={handleCloseClick}
        >
          <Close />
        </IconButton>
      </DialogTitle>
    ) : undefined;

    return (
      <MuiDialog
        className={props.className}
        fullScreen={windowed}
        onClose={handleClose}
        TransitionComponent={Transition}
        {...props}
      >
        {renderTitle}
        <DialogContent>{children}</DialogContent>
        {renderActions}
      </MuiDialog>
    );
  }
)`
  ${({ theme }: Styles) => `
    & .MuiDialog-paper {
      background: ${theme.palette.background.default};
    }

    & .MuiDialogActions-root {
      padding: ${theme.spacing(0, 3, 2, 3)};
    }

    & .MuiDialogContent-root {
      padding: ${theme.spacing(0, 3, 2, 3)};
    }

    & .MuiDialogTitle-root {
      align-items: center;
      display: flex;

      & .MuiIconButton-root {
        margin-left: auto;
      }
    }
  `}
`;

const DialogTransition = forwardRef((props: SlideProps, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));
