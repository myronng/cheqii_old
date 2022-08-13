import { styled } from "@mui/material/styles";
import { LinkIconButton } from "components/Link";
import { Logo } from "components/Logo";
import { BaseProps } from "declarations";

export const Header = styled((props: Pick<BaseProps, "className">) => (
  <header className={`Header-root ${props.className}`}>
    <LinkIconButton className="Header-home" color="primary" NextLinkProps={{ href: "/" }}>
      <Logo />
    </LinkIconButton>
  </header>
))`
  ${({ theme }) => `
    display: flex;
    margin: ${theme.spacing(2)};

    & .Header-home {
      padding: 0;
    }
  `}
`;
