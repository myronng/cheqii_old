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
} from "@material-ui/core";
import { styled, useTheme } from "@material-ui/core/styles";
import { Close } from "@material-ui/icons";
import { MouseEventHandler, ReactNode } from "react";

export interface DialogProps extends MuiDialogProps {
  dialogActions?: ReactNode;
  dialogTitle?: ReactNode;
  onClose?: (event: {}, reason: "backdropClick" | "buttonClick" | "escapeKeyDown") => void;
}

export const Dialog = styled(
  ({ dialogActions, children, fullScreen, onClose, dialogTitle, ...props }: DialogProps) => {
    const theme = useTheme();
    const mobileLayout = useMediaQuery(theme.breakpoints.down("sm"));
    const windowed = fullScreen ?? mobileLayout;
    const Transition = windowed ? DialogTransition : undefined;

    const handleCloseClick: MouseEventHandler<HTMLButtonElement> = (e) => {
      if (typeof onClose === "function") {
        onClose(e, "buttonClick");
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
        <IconButton aria-label="close" edge="end" onClick={handleCloseClick}>
          <Close />
        </IconButton>
      </DialogTitle>
    ) : undefined;

    return (
      <MuiDialog
        className={props.className}
        fullScreen={windowed}
        onClose={onClose}
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
  & .MuiDialogTitle-root {
    align-items: center;
    display: flex;

    & .MuiIconButton-root {
      margin-left: auto;
    }
  }
`;

const DialogTransition = (props: SlideProps) => (
  <Slide direction="up" {...props}>
    {props.children}
  </Slide>
);
