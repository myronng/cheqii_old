import { createContext, PropsWithChildren, useReducer } from "react";

const INITIAL_STATE: LoadingStateType = {
  active: false,
  queue: [],
};

export type LoadingStateType = {
  active: boolean;
  queue: string[];
};

export type LoadingActionType = {
  active: boolean;
  id: string;
};

export const LoadingContextProvider = (props: PropsWithChildren<{}>) => {
  const [loading, setLoading] = useReducer((state: LoadingStateType, action: LoadingActionType) => {
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

export const LoadingContext = createContext({
  loading: INITIAL_STATE,
  setLoading: (_state: LoadingActionType) => {},
});
