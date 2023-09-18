import { Backdrop, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Logo } from "components/Logo";
import { BaseProps } from "declarations";
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from "react";

type SplashProps = Pick<BaseProps, "className"> & {
  appear?: boolean;
  open: boolean;
};

export type SplashState = {
  active: boolean;
};

export type SetSplashState = Dispatch<SetStateAction<SplashState>>;

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

const SplashContext = createContext<{
  setSplash: Dispatch<SetStateAction<SplashState>>;
  splash: SplashState;
}>({
  setSplash: () => {},
  splash: { active: false },
});

export const SplashContextProvider = (props: PropsWithChildren<{ open?: boolean }>) => {
  const [splash, setSplash] = useState({ active: props.open ?? false });

  return (
    <SplashContext.Provider value={{ splash, setSplash }}>
      {props.children}
      <Splash open={splash.active} />
    </SplashContext.Provider>
  );
};

export const useSplash = () => useContext(SplashContext);

Splash.displayName = "Splash";
SplashContextProvider.displayName = "SplashContextProvider";
