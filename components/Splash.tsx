import { Backdrop, CircularProgress } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { BaseProps } from "declarations";
import logoColor from "images/logos/logo-color.svg";
import logoWhite from "images/logos/logo-white.svg";
import Image from "next/image";

type SplashProps = Pick<BaseProps, "className"> & {
  appear?: boolean;
  open: boolean;
};

export const Splash = styled((props: SplashProps) => {
  const theme = useTheme();

  return (
    <Backdrop appear={props.appear ?? false} className={props.className} open={props.open}>
      <CircularProgress size={160} />
      <Image
        height={128}
        layout="fixed"
        src={theme.palette.mode === "dark" ? logoWhite : logoColor}
        width={128}
      />
    </Backdrop>
  );
})`
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
