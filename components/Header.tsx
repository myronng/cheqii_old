import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account, AccountProps } from "components/Account";
import { LinkIconButton } from "components/Link";
import { Logo } from "components/Logo";
import { BaseProps } from "declarations";
import Head from "next/head";

type HeaderProps = Pick<BaseProps, "className" | "strings"> & {
  disabledMenuItems?: AccountProps["disabledMenuItems"];
  title: string;
};

export const Header = styled((props: HeaderProps) => (
  <header className={`Header-root ${props.className}`}>
    <Head>
      <title>{props.title}</title>
    </Head>
    <LinkIconButton className="Header-home" color="primary" NextLinkProps={{ href: "/" }}>
      <Logo />
    </LinkIconButton>
    <Typography className="Header-title" component="h1" variant="h2">
      {props.title}
    </Typography>
    <div className="Header-actions">
      <Account
        className="Header-account"
        disabledMenuItems={props.disabledMenuItems}
        strings={props.strings}
      />
    </div>
  </header>
))`
  ${({ theme }) => `
    display: flex;
    gap: ${theme.spacing(2)};
    overflow: auto hidden;
    padding: ${theme.spacing(2)};

    & .Header-actions {
      margin-left: auto;
    }

    & .Header-home {
      padding: 0;
    }

    & .Header-title {
      align-self: center;
    }
  `}
`;
