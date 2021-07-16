import { Alert, IconButton, Snackbar as MuiSnackbar } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { Close, ContentCopy } from "@material-ui/icons";
import { useSnackbar } from "utilities/SnackbarContextProvider";

const Message = styled("pre")`
  font-family: Fira Code, monospace;
  font-weight: 300;
  margin: 0;
  max-height: calc(100vh - 76px);
  max-width: calc(100vw - 170px);
  overflow: auto;
`;

export const Snackbar = () => {
  const { snackbar, setSnackbar } = useSnackbar();

  const handleClose = () => setSnackbar({ active: false });

  return (
    <MuiSnackbar
      autoHideDuration={snackbar.autoHideDuration || 6000}
      onClose={handleClose}
      open={snackbar.active === true}
    >
      <Alert
        action={
          <>
            {snackbar.type === "error" && (
              <IconButton
                color="inherit"
                onClick={async () => {
                  if (typeof snackbar.message === "string") {
                    navigator.clipboard.writeText(snackbar.message);
                  }
                }}
                size="small"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            )}
            <IconButton color="inherit" onClick={handleClose} size="small">
              <Close fontSize="small" />
            </IconButton>
          </>
        }
        onClose={handleClose}
        severity={snackbar.type}
        variant="filled"
      >
        <Message>{snackbar.message}</Message>
      </Alert>
    </MuiSnackbar>
  );
};
