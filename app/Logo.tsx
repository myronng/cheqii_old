import { IconButton, IconButtonProps } from "@mui/material";
// import { useTheme } from "@mui/material/styles";
// import logoColor from "images/logos/logo-color.svg";
// import logoWhite from "images/logos/logo-white.svg";
// import Image, { ImageProps } from "next/image";
import { MouseEventHandler } from "react";

export type LogoProps = IconButtonProps & {
  // ImageProps?: Partial<ImageProps>;
  size?: number;
};

export const Logo = ({ size, ...props }: LogoProps) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = (_e) => {};

  return (
    <IconButton color="primary" onClick={handleClick} {...props}>
      <svg height="256" viewBox="0 0 256 256" width="256" xmlns="http://www.w3.org/2000/svg">
        <circle cx="56" cy="128" fill="#1ccb49" r="24" stroke="#1c2841" stroke-width="2" />
        <line
          stroke="#1c2841"
          stroke-linecap="round"
          stroke-width="40"
          x1="88"
          x2="200"
          y1="180"
          y2="80"
        />
      </svg>

      {/* <Image
        alt="Logo"
        height={size ?? 40}
        layout="fixed"
        src={logoWhite}
        width={size ?? 40}
        {...ImageProps}
      /> */}
    </IconButton>
  );
};

Logo.displayName = "Logo";
