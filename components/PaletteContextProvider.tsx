import { responsiveFontSizes, Theme } from "@mui/material/styles";
import { parseCookies, setCookie } from "nookies";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { PaletteModeType } from "services/parser";
import { theme } from "services/theme";

const INITIAL_STATE: Theme = theme("system");

const PaletteContext = createContext({
  paletteMode: "system",
  theme: INITIAL_STATE,
  setPaletteMode: (_state: PaletteModeType) => {},
});

export const PaletteContextProvider = (
  props: PropsWithChildren<{ serverPaletteModeCookie: PaletteModeType }>
) => {
  const clientPaletteModeCookie = parseCookies(undefined).paletteMode as PaletteModeType;
  let renderType;
  if (typeof window !== "undefined") {
    const metaRenderType = document.head.querySelector(
      'meta[name="render-type"]'
    ) as HTMLMetaElement;
    renderType = metaRenderType.content;
  }
  const initializedPaletteMode = props.serverPaletteModeCookie || clientPaletteModeCookie;
  const [paletteMode, setPaletteMode] = useReducer(
    (_state: PaletteModeType, action: PaletteModeType) => {
      const paletteModeExpiryDate = new Date();
      paletteModeExpiryDate.setFullYear(paletteModeExpiryDate.getFullYear() + 10);
      setCookie(undefined, "paletteMode", action, {
        maxAge: (paletteModeExpiryDate.getTime() - new Date().getTime()) / 1000,
        path: "/",
        sameSite: "strict",
        secure: true,
      });
      return action;
    },
    renderType !== "SSG" && initializedPaletteMode !== "system" ? initializedPaletteMode : "unknown"
  );

  const appTheme = useMemo(
    () => responsiveFontSizes(theme(paletteMode), { factor: 3 }),
    [paletteMode]
  );

  useEffect(() => {
    if (typeof clientPaletteModeCookie === "undefined") {
      setPaletteMode("system");
    } else if (clientPaletteModeCookie !== paletteMode) {
      setPaletteMode(clientPaletteModeCookie);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PaletteContext.Provider value={{ paletteMode, theme: appTheme, setPaletteMode }}>
      {props.children}
    </PaletteContext.Provider>
  );
};

export const usePalette = () => useContext(PaletteContext);

PaletteContextProvider.displayName = "PaletteContextProvider";
