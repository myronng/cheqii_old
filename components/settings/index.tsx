import { styled } from "@mui/material/styles";
import { Header } from "components/settings/Header";
import { Preferences } from "components/settings/Preferences";
import { Profile } from "components/settings/Profile";
import { SettingsPageProps } from "pages/settings";

export const SettingsPage = styled((props: SettingsPageProps) => (
  <div className={props.className}>
    <Header strings={props.strings} />
    <main className="Body-root">
      <div className="Body-page">
        <Profile strings={props.strings} />
      </div>
      <div className="Body-page">
        <Preferences strings={props.strings} userData={props.userData} />
      </div>
    </main>
  </div>
))`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;

    & .Body-page {
      align-items: center;
      display: flex;
      height: 100%;
      justify-content: center;
      padding: ${theme.spacing(2)};
      width: 100%;
    }

    & .Body-root {
      background: ${theme.palette.background.secondary};
      border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};
      height: 100%;
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
