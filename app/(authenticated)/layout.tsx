import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account, AccountProps } from "app/(authenticated)/Account";
import { Logo } from "app/Logo";
import { BaseProps } from "declarations";

type LayoutProps = BaseProps & {
  disabledMenuItems?: AccountProps["disabledMenuItems"];
  title: string;
};

const Layout = styled((props: LayoutProps) => (
  <>
    <header className={`Header-root ${props.className}`}>
      <Logo className="Header-home" />
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
    {props.children}
  </>
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

export default Layout;
