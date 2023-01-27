import { createContext, useContext, useEffect, useState } from "react";

import type { PropsWithChildren } from "react";

const INITIAL_STATE =
  typeof window !== "undefined" && window.location.hash !== "" ? window.location.hash : "#";

const HashContext = createContext(INITIAL_STATE);

export const HashContextProvider = (props: PropsWithChildren<{}>) => {
  const [hash, setHash] = useState(INITIAL_STATE);

  useEffect(() => {
    const onWindowHashChange: WindowEventHandlers["onhashchange"] = (_e) => {
      setHash(window.location.hash);
    };
    window.addEventListener("hashchange", onWindowHashChange);

    return () => {
      window.removeEventListener("hashchange", onWindowHashChange);
    };
  }, []);

  return <HashContext.Provider value={hash}>{props.children}</HashContext.Provider>;
};

export const useHash = () => useContext(HashContext);

HashContextProvider.displayName = "HashContextProvider";
