import { useTheme } from "@mui/material/styles";
import logoColor from "images/logos/logo-color.svg";
import logoWhite from "images/logos/logo-white.svg";
import Image, { ImageProps } from "next/image";

export type LogoProps = Partial<ImageProps> & {
  size?: number;
};

export const Logo = (props: LogoProps) => {
  const theme = useTheme();

  return (
    <Image
      alt="Logo"
      height={props.size ?? 40}
      layout="fixed"
      src={theme.palette.mode === "dark" ? logoWhite : logoColor}
      width={props.size ?? 40}
      {...props}
    />
  );
};

Logo.displayName = "Logo";
