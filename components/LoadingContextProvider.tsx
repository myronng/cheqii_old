import { createContext, Dispatch, useContext, useReducer } from "react";

import type { PropsWithChildren } from "react";

export interface LoadingState {
  active: boolean;
  queue: string[];
}

export interface LoadingAction {
  active: boolean;
  id?: string;
}

const INITIAL_STATE: LoadingState = {
  active: false,
  queue: [],
};

const LoadingContext = createContext<{
  loading: LoadingState;
  setLoading: Dispatch<LoadingAction>;
}>({
  loading: INITIAL_STATE,
  setLoading: () => {},
});

export const LoadingContextProvider = (props: PropsWithChildren<{}>) => {
  const [loading, setLoading] = useReducer((state: LoadingState, action: LoadingAction) => {
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
  }, INITIAL_STATE);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {props.children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);

LoadingContextProvider.displayName = "LoadingContextProvider";
