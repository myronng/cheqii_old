import { Alert, IconButton, Snackbar as MuiSnackbar } from "@material-ui/core";
import { experimentalStyled as styled } from "@material-ui/core/styles";
import { Close, ContentCopy } from "@material-ui/icons";
import { useContext } from "react";
import { SnackbarContext } from "utilities/SnackbarContextProvider";

const Message = styled("pre")`
  font-family: Fira Code, monospace;
  font-weight: 300;
  margin: 0;
  max-height: calc(100vh - 76px);
  max-width: calc(100vw - 170px);
  overflow: auto;
`;

export const Snackbar = (props) => {
  const { snackbar, setSnackbar } = useContext(SnackbarContext);

  const handleClose = () => setSnackbar({ active: false });

  return (
    <MuiSnackbar
      autoHideDuration={snackbar.autoHideDuration || 6000}
      onClose={handleClose}
      open={snackbar.active === true}
      {...props}
    >
      <Alert
        action={
          <>
            {snackbar.type === "error" && (
              <IconButton
                color="inherit"
                onClick={async () => navigator.clipboard.writeText(snackbar.message)}
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
