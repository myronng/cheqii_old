import { Backdrop, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Logo } from "components/Logo";
import { BaseProps } from "declarations";

type SplashProps = Pick<BaseProps, "className"> & {
  appear?: boolean;
  open: boolean;
};

export const Splash = styled((props: SplashProps) => (
  <Backdrop appear={props.appear ?? false} className={props.className} open={props.open}>
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

Splash.displayName = "Splash";
