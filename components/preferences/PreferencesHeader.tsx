import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { LinkIconButton } from "components/Link";
import { Logo } from "components/Logo";
import { BaseProps } from "declarations";
import Head from "next/head";

export const PreferencesHeader = styled((props: Pick<BaseProps, "className" | "strings">) => (
  <header className={`Header-root ${props.className}`}>
    <Head>
      <title>{props.strings["preferences"]}</title>
    </Head>
    <LinkIconButton className="Header-home" NextLinkProps={{ href: "/" }}>
      <Logo />
    </LinkIconButton>
    <Typography className="Header-title" component="h1" variant="h2">
      {props.strings["preferences"]}
    </Typography>
  </header>
))`
  ${({ theme }) => `
    display: flex;
    margin: ${theme.spacing(2)};

    & .Header-home {
      padding: 0;
    }

    & .Header-title {
      align-self: center;
      margin-bottom: 0;
      margin-left: ${theme.spacing(2)};
    }
  `}
`;
