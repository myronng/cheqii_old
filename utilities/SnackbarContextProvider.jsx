import { Snackbar } from "components/Snackbar";
import { createContext, useReducer } from "react";
import { parseError } from "services/parser";

const snackbarTypes = ["success", "warning", "error", "info"];

export const SnackbarContextProvider = (props) => {
  const [snackbar, setSnackbar] = useReducer(
    (state, action) => {
      const snackbarState = { ...state };
      snackbarState.active = action.active;
      if (snackbarTypes.includes(action.type)) {
        snackbarState.type = action.type;
      }
      if (snackbarState.type === "error") {
        snackbarState.message = parseError(action.message);
      } else {
        snackbarState.message = action.message;
      }
      snackbarState.autoHideDuration = action.autoHideDuration;
      return snackbarState;
    },
    {
      active: false,
      message: null,
      type: "info",
    }
  );

  return (
    <SnackbarContext.Provider value={{ snackbar, setSnackbar }}>
      {props.children}
      <Snackbar />
    </SnackbarContext.Provider>
  );
};

export const SnackbarContext = createContext(null);
