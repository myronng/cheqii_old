import { AccountCircle, Security as SecurityIcon, Tune } from "@mui/icons-material";
import { List } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ListItem } from "components/List";
import { Header } from "components/settings/Header";
import { Preferences } from "components/settings/Preferences";
import { Profile } from "components/settings/Profile";
import { Security } from "components/settings/Security";
import { SettingsPageProps } from "pages/settings";

export const SettingsPage = styled((props: SettingsPageProps) => (
  <div className={props.className}>
    <Header strings={props.strings} />
    <main className="Body-root">
      <nav className="Body-navigation">
        <List>
          <ListItem
            avatar={<AccountCircle />}
            ListItemButtonProps={{
              href: "#profile",
            }}
            ListItemTextProps={{ primary: props.strings["profile"] }}
          />
          <ListItem
            avatar={<Tune />}
            ListItemButtonProps={{
              href: "#preferences",
            }}
            ListItemTextProps={{ primary: props.strings["preferences"] }}
          />
          <ListItem
            avatar={<SecurityIcon />}
            ListItemButtonProps={{
              href: "#security",
            }}
            ListItemTextProps={{ primary: props.strings["security"] }}
          />
        </List>
      </nav>
      <div className="Body-container">
        <section className="Body-page">
          <Profile className="Body-content" strings={props.strings} />
        </section>
        <section className="Body-page">
          <Preferences className="Body-content" strings={props.strings} userData={props.userData} />
        </section>
        <section className="Body-page">
          <Security className="Body-content" strings={props.strings} />
        </section>
      </div>
    </main>
  </div>
))`
  ${({ theme }) => `
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100vh;

    & .Body-container {
      flex-grow: 1;
      height: 100%;
    }

    & .Body-content {
      background: ${theme.palette.background.default};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(4)};
      padding: ${theme.spacing(4)};

      ${theme.breakpoints.down("md")} {
        border-bottom: 2px solid ${theme.palette.divider};
        border-top: 2px solid ${theme.palette.divider};
        height: 100%;
        margin: auto;
        width: 100%;
      }

      ${theme.breakpoints.up("md")} {
        border: 2px solid ${theme.palette.divider};
        border-radius: ${theme.shape.borderRadius}px;
        margin: auto;
        width: 600px;
      }
    }

    & .Body-navigation {
      background: ${theme.palette.background.default};
      flex-shrink: 0;

      & .MuiListItemButton-root {
        gap: ${theme.spacing(2)};

        & .MuiListItemAvatar-root {
          min-width: initial;

          & .MuiSvgIcon-root {
            display: block;
          }
        }
      }
    }

    & .Body-page {
      display: flex;
      min-height: 100%; // Use min-height instead of height for small vertical viewports
      scroll-snap-align: start;
    }

    & .Body-root {
      background: ${theme.palette.background.secondary};
      border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};
      display: flex;
      height: 100%;
      overflow: hidden; // Fixes scrolling issues

      ${theme.breakpoints.down("md")} {
        flex-direction: column;
        overflow: auto;
        scroll-behavior: smooth;
        scroll-snap-type: y mandatory;

        & .Body-navigation {
          border-bottom: 2px solid ${theme.palette.secondary[theme.palette.mode]};
          scroll-snap-align: start;
        }
      }

      ${theme.breakpoints.up("md")} {
        & .Body-container {
          overflow: auto;
          scroll-behavior: smooth;
          scroll-snap-type: y mandatory;
        }

        & .Body-navigation {
          border-right: 2px solid ${theme.palette.secondary[theme.palette.mode]};
        }
      }
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
