import { Backdrop, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Logo } from "components/Logo";
import { BaseProps } from "declarations";
import { createContext, PropsWithChildren, useContext, useState } from "react";

type SplashProps = Pick<BaseProps, "className"> & {
  appear?: boolean;
  open: boolean;
};

export const Splash = styled((props: SplashProps) => (
  <Backdrop
    appear={props.appear ?? false}
    className={props.className}
    open={props.open}
    unmountOnExit
  >
    <CircularProgress size={160} />
    <Logo size={128} />
  </Backdrop>
))`
  ${({ theme }) => `
    align-items: center;
    background-color: ${theme.palette.background.default};
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2000;

    & .MuiCircularProgress-root {
      position: absolute;
      z-index: 2001;

      & .MuiCircularProgress-circle {
        stroke-width: 1;
      }
    }
  `}
`;

const SplashContext = createContext({
  splash: false,
  setSplash: (_state: boolean) => {},
});

export const SplashContextProvider = (props: PropsWithChildren<{ open?: boolean }>) => {
  const [splash, setSplash] = useState(props.open ?? false);

  return (
    <SplashContext.Provider value={{ splash, setSplash }}>
      {props.children}
      <Splash open={splash} />
    </SplashContext.Provider>
  );
};

export const useSplash = () => useContext(SplashContext);

Splash.displayName = "Splash";
SplashContextProvider.displayName = "SplashContextProvider";
