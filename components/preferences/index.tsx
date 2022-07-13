import { TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PreferencesHeader } from "components/preferences/PreferencesHeader";
import { PreferencesPageProps } from "pages/preferences";

export const PreferencesPage = styled((props: PreferencesPageProps) => (
  <div className={props.className}>
    <PreferencesHeader strings={props.strings} />
    <main className="Body-root">
      <div className="Body-container">
        <Typography className="Body-heading" component="h2" variant="h3">
          {props.strings["profile"]}
        </Typography>
        <TextField label={props.strings["email"]} />
        <TextField label={props.strings["name"]} />
      </div>
    </main>
  </div>
))`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;

    & .Body-container {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(2)};

      ${theme.breakpoints.down("sm")} {
        width: 100%;
      }

      ${theme.breakpoints.up("sm")} {
        min-width: 600px;
      }

      & .Body-heading {
        padding: ${theme.spacing(0, 2.75)};
      }
    }

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
