import { useTheme } from "@mui/material/styles";
import logoColor from "images/logos/logo-color.svg";
import logoWhite from "images/logos/logo-white.svg";
import Image from "next/image";

export type LogoProps = {
  size?: number;
};

export const Logo = (props: LogoProps) => {
  const theme = useTheme();

  return (
    <Image
      height={props.size ?? 40}
      layout="fixed"
      src={theme.palette.mode === "dark" ? logoWhite : logoColor}
      width={props.size ?? 40}
    />
  );
};

Logo.displayName = "Logo";
