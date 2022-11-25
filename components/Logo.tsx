import { useTheme } from "@mui/material/styles";
import logoColor from "public/static/logo-color.svg";
import logoWhite from "public/static/logo-white.svg";
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
      src={theme.palette.mode === "dark" ? logoWhite : logoColor}
      width={props.size ?? 40}
      {...props}
    />
  );
};

Logo.displayName = "Logo";
