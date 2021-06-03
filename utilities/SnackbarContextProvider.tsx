import { Snackbar } from "components/Snackbar";
import { createContext, PropsWithChildren, useReducer } from "react";
import { parseError } from "services/parser";

const INITIAL_STATE: SnackbarActionType = {
  active: false,
  message: "",
  type: "info",
};

export type SnackbarActionType = {
  active: boolean;
  autoHideDuration?: number;
  message?: string;
  type?: "error" | "info" | "success" | "warning";
};

export const SnackbarContextProvider = (props: PropsWithChildren<{}>) => {
  const [snackbar, setSnackbar] = useReducer(
    (state: SnackbarActionType, action: SnackbarActionType) => {
      const snackbarState = { ...state };
      snackbarState.active = action.active;
      if (snackbar.active === true) {
        snackbarState.type = action.type;
        if (typeof action.message === "string") {
          if (snackbarState.type === "error") {
            snackbarState.message = parseError(action.message);
          } else {
            snackbarState.message = action.message;
          }
        }
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

export const SnackbarContext = createContext({
  snackbar: INITIAL_STATE,
  setSnackbar: (_state: SnackbarActionType) => {},
});
