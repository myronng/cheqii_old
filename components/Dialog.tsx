import { Close } from "@mui/icons-material";
import {
  Dialog as MuiDialog,
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
import { useLoading } from "components/LoadingContextProvider";
import { forwardRef, MouseEventHandler, ReactNode } from "react";

export interface DialogProps extends MuiDialogProps {
  dialogTitle?: ReactNode;
  onClose?: (
    event: {},
    reason: "actionClick" | "backdropClick" | "closeClick" | "escapeKeyDown"
  ) => void;
}

export const Dialog = styled(
  ({ children, fullScreen, onClose, dialogTitle, ...props }: DialogProps) => {
    const theme = useTheme();
    const { loading } = useLoading();
    const mobileLayout = useMediaQuery(theme.breakpoints.down("sm"));
    const windowed = fullScreen ?? mobileLayout;

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
        PaperProps={{ elevation: 0 }}
        scroll={windowed ? "paper" : "body"}
        TransitionComponent={DialogTransition}
        {...props}
      >
        {renderTitle}
        <DialogContent>{children}</DialogContent>
      </MuiDialog>
    );
  }
)`
  ${({ theme }) => `
    ${theme.breakpoints.up("sm")} {
      & .MuiPaper-root {
        --dialog-bg-color: ${
          theme.palette.background.default
        }; // Use variable to prevent prettier formatting on template strings
        border-radius: 0;
        background: linear-gradient(135deg, transparent 8px, var(--dialog-bg-color) 8.01px) top left, linear-gradient(45deg, var(--dialog-bg-color) 4px, transparent 4.01px) top left, linear-gradient(135deg, var(--dialog-bg-color) 4px, transparent 4.01px) bottom left, linear-gradient(45deg, transparent 8px, var(--dialog-bg-color) 8.01px) bottom left;
        background-size: 12px 6px;
        background-repeat: repeat-x;
        padding: 6px 0;
      }
    }

    & .MuiDialogContent-root {
      background: ${theme.palette.background.default};
    }

    & .MuiDialogTitle-root {
      align-items: center;
      background: ${theme.palette.background.default};
      border-bottom: 2px solid ${theme.palette.divider};
      display: flex;
      padding: ${theme.spacing(2)};

      & + .MuiDialogContent-root {
        padding: ${theme.spacing(2)};
      }

      & .MuiIconButton-root {
        margin-left: auto;
      }
    }
  `}
`;

const DialogTransition = forwardRef<JSX.Element, SlideProps>((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

Dialog.displayName = "Dialog";
DialogTransition.displayName = "DialogTransition";
