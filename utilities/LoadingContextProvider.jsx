import { createContext, useReducer } from "react";

export const LoadingContextProvider = (props) => {
  const [loading, setLoading] = useReducer(
    (state, action) => {
      const loadingState = { ...state };

      if (action.active === true) {
        if (action.id !== undefined) {
          loadingState.queue.push(action.id);
        }
        loadingState.active = action.active;
      } else if (action.active === false) {
        if (action.id !== undefined) {
          loadingState.queue = loadingState.queue.filter((item) => item !== action.id);
        } else {
          loadingState.queue = [];
        }
        loadingState.active = action.active;
      } else if (action.id !== undefined) {
        if (loadingState.queue.includes(action.id)) {
          loadingState.queue = loadingState.queue.filter((item) => item !== action.id);
        } else {
          loadingState.queue.push(action.id);
        }
        loadingState.active = loadingState.queue.length > 0;
      }
      return loadingState;
    },
    {
      active: false,
      queue: [],
    }
  );

  return (
    <LoadingContext.Provider value={{ loading: loading, setLoading: setLoading }}>
      {props.children}
    </LoadingContext.Provider>
  );
};

export const LoadingContext = createContext(null);
