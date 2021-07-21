import router from "next/router";
import { LoadingAction } from "utilities/LoadingContextProvider";

type redirectType = (setLoading: (state: LoadingAction) => void, path?: string) => void;

export const redirect: redirectType = (setLoading, path) => {
  const handleRouteChange = () => {
    setLoading({ active: false });
    router.events.off("routeChangeComplete", handleRouteChange);
  };
  router.events.on("routeChangeComplete", handleRouteChange);
  if (path) {
    router.push(path);
  }
};
