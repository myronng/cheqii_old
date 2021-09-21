import { Alert, IconButton, Snackbar as MuiSnackbar } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Close, ContentCopy } from "@mui/icons-material";
import { BaseProps } from "declarations";
import { createContext, PropsWithChildren, useContext, useReducer } from "react";
import { parseError } from "services/parser";

const INITIAL_STATE: SnackbarActionType = {
  active: false,
  message: "",
  type: "info",
};

interface SnackbarActionType {
  active: boolean;
  autoHideDuration?: number;
  message?: unknown;
  type?: "error" | "info" | "success" | "warning";
}

type MessageProps = Pick<BaseProps, "className" | "children"> & {
  type: SnackbarActionType["type"];
};

const Message = styled(({ children, type, ...props }: MessageProps) => (
  <pre {...props}>{children}</pre>
))`
  ${({ type }) => `
    font-family: ${type === "error" ? "Fira Code, monospace" : "inherit"};
    font-weight: 300;
    margin: 0;
    max-height: calc(100vh - 76px);
    max-width: calc(100vw - 170px);
    overflow: auto;
  `}
`;

const Snackbar = () => {
  const { snackbar, setSnackbar } = useSnackbar();
  const errorMessage = parseError(snackbar.message);
  let snackbarMessage;
  if (typeof errorMessage === "string") {
    snackbarMessage = errorMessage;
  } else {
    snackbarMessage = "Unknown error";
    console.error(`Unknown error ${errorMessage}`);
  }

  const handleCopyClick = () => {
    if (typeof snackbar.message === "string") {
      navigator.clipboard.writeText(snackbar.message);
    }
  };

  const handleClose = () => setSnackbar({ active: false });

  return (
    <MuiSnackbar
      autoHideDuration={snackbar.autoHideDuration || 5000}
      onClose={handleClose}
      open={snackbar.active === true}
    >
      <Alert
        action={
          <>
            {snackbar.type === "error" && (
              <IconButton color="inherit" onClick={handleCopyClick} size="small">
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
        <Message type={snackbar.type}>{snackbarMessage}</Message>
      </Alert>
    </MuiSnackbar>
  );
};

const SnackbarContext = createContext({
  snackbar: INITIAL_STATE,
  setSnackbar: (_state: SnackbarActionType) => {},
});

export const SnackbarContextProvider = (props: PropsWithChildren<{}>) => {
  const [snackbar, setSnackbar] = useReducer(
    (state: SnackbarActionType, action: SnackbarActionType) => {
      const snackbarState = { ...state };
      snackbarState.active = action.active;
      if (snackbarState.active === true) {
        snackbarState.type = action.type;
        snackbarState.message = action.message;
        snackbarState.autoHideDuration = action.autoHideDuration;
      }
      return snackbarState;
    },
    INITIAL_STATE
  );

  return (
    <SnackbarContext.Provider value={{ snackbar, setSnackbar }}>
      {props.children}
      <Snackbar />
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => useContext(SnackbarContext);
