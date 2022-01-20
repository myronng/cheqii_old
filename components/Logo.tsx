import { useTheme } from "@mui/system";
import logoColor from "images/logos/logo-color.svg";
import logoWhite from "images/logos/logo-white.svg";
import Image from "next/image";

export const Logo = () => {
  const theme = useTheme();

  return (
    <Image
      height={40}
      layout="fixed"
      src={theme.palette.mode === "dark" ? logoWhite : logoColor}
      width={40}
    />
  );
};
