import { styled } from "@mui/material/styles";
import { Header } from "components/settings/Header";
import { Profile } from "components/settings/Profile";
import { SettingsPageProps } from "pages/settings";

export const SettingsPage = styled((props: SettingsPageProps) => (
  <div className={props.className}>
    <Header strings={props.strings} />
    <main className="Body-root">
      <Profile strings={props.strings} />
    </main>
  </div>
))`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;

    & .Body-root {
      align-items: center;
      background: ${theme.palette.background.secondary};
      border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};
      display: flex;
      flex: 1;
      justify-content: center;
      overflow: auto;
    }

    & .Header-title {
      align-self: center;
      margin-bottom: 0;
      margin-left: ${theme.spacing(2)};
    }

    & .Header-root {
      display: flex;
      margin: ${theme.spacing(2)};
    }
  `}
`;
