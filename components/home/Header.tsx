import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { Logo } from "components/Logo";
import { BaseProps } from "declarations";
import Head from "next/head";

export const Header = styled((props: Pick<BaseProps, "className" | "strings">) => (
  <header className={`Header-root ${props.className}`}>
    <Head>
      <title>{props.strings["applicationTitle"]}</title>
    </Head>
    <Logo />
    <Typography className="Header-title" component="h1" variant="h2">
      {props.strings["applicationTitle"]}
    </Typography>
    <Account className="Header-account" strings={props.strings} />
  </header>
))`
  ${({ theme }) => `
    display: flex;
    margin: ${theme.spacing(2)};

    & .Header-account {
      margin-left: auto;
    }

    & .Header-title {
      align-self: center;
      margin-bottom: 0;
      margin-left: ${theme.spacing(2)};
    }
  `}
`;
