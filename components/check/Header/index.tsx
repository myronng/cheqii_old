import { Settings as SettingsIcon, Share } from "@mui/icons-material";
import { Collapse, IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account, AccountProps } from "components/Account";
import { ShareClickHandler } from "components/check";
import { Settings, SettingsProps } from "components/check/Header/Settings";
import { TitleTextField } from "components/check/Header/TitleTextField";
import { LinkIconButton } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { Logo } from "components/Logo";
import { BaseProps, CheckSettings } from "declarations";
import Head from "next/head";
import { Dispatch, memo, MouseEventHandler, SetStateAction } from "react";

export type HeaderProps = Pick<BaseProps, "className" | "strings"> & {
  accessLink: string;
  checkSettings: CheckSettings;
  checkId: string;
  downSm: boolean;
  onDownloadCsvClick: MouseEventHandler<HTMLButtonElement>;
  setCheckSettings: Dispatch<SetStateAction<CheckSettings>>;
  settingsOpen: boolean;
  showTitle: boolean;
  unsubscribe: () => void;
  userAccess: SettingsProps["userAccess"];
  writeAccess: boolean;
};

const HeaderUnstyled = memo((props: HeaderProps) => {
  const { loading } = useLoading();

  const handleSettingsDialogClose: SettingsProps["onClose"] = (_e, _reason) => {
    window.location.hash = "#";
  };

  const handleShareClick: ShareClickHandler = async () => {
    try {
      await navigator.share({
        title: props.checkSettings.title,
        url: props.accessLink,
      });
    } catch (err) {
      navigator.clipboard.writeText(props.accessLink);
    }
  };

  const handleSignOut: AccountProps["onSignOut"] = async () => {
    props.unsubscribe();
  };

  return (
    <header className={`Header-root ${props.className}`}>
      <Head>
        <title>{props.checkSettings.title}</title>
      </Head>
      <LinkIconButton className="Header-home" color="primary" NextLinkProps={{ href: "/" }}>
        <Logo />
      </LinkIconButton>
      <Collapse className="Header-title" in={!props.downSm || props.showTitle}>
        <TitleTextField
          checkId={props.checkId}
          disabled={loading.active || !props.writeAccess}
          label={props.strings["title"]}
          setCheckSettings={props.setCheckSettings}
          size="small"
          value={props.checkSettings.title}
          variant="outlined"
          writeAccess={props.writeAccess}
        />
      </Collapse>
      <IconButton
        aria-label={props.strings["share"]}
        disabled={loading.active}
        onClick={handleShareClick}
      >
        <Share />
      </IconButton>
      <Collapse className="Header-settings" in={!props.downSm || props.showTitle}>
        <IconButton
          aria-label={props.strings["settings"]}
          disabled={loading.active}
          href="#settings"
        >
          <SettingsIcon />
        </IconButton>
      </Collapse>
      <Account onSignOut={handleSignOut} strings={props.strings} />
      <Settings
        accessLink={props.accessLink}
        checkId={props.checkId}
        checkSettings={props.checkSettings}
        onClose={handleSettingsDialogClose}
        onDownloadCsvClick={props.onDownloadCsvClick}
        onShareClick={handleShareClick}
        open={props.settingsOpen}
        setCheckSettings={props.setCheckSettings}
        strings={props.strings}
        unsubscribe={props.unsubscribe}
        userAccess={props.userAccess}
        writeAccess={props.writeAccess}
      />
    </header>
  );
});

export const Header = styled(HeaderUnstyled)`
  ${({ theme }) => `
    background: ${theme.palette.background.default}; // Combine with z-index to prevent overflow
    border-bottom: 2px solid ${theme.palette.secondary[theme.palette.mode]};
    gap: ${theme.spacing(0, 2)};
    overflow: auto hidden;
    padding: ${theme.spacing(2)};
    position: relative;
    z-index: 1000;

    ${theme.breakpoints.down("sm")} {
      display: grid;
      grid-template-columns: 1fr max-content max-content;
      grid-template-rows: max-content max-content;

      & .Header-home {
        margin-right: auto;
      }

      & .Header-settings {
        grid-column: 3;
        grid-row: 2;

        & .MuiIconButton-root {
          margin-top: ${theme.spacing(2)};
        }
      }

      & .Header-title {
        grid-column: span 2;
        grid-row: 2;

        & .MuiTextField-root {
          margin-top: ${theme.spacing(2)};
        }
      }
    }

    ${theme.breakpoints.up("sm")} {
      display: flex;

      & .Header-title {
        margin-right: auto;
      }
    }

    & .Header-actions {
      display: flex;
      gap: ${theme.spacing(2)};
      margin-left: auto;
    }

    & .Header-home {
      padding: 0;
    }

    & .Header-title .MuiTextField-root {
      width: 100%;
    }
  `}
`;

Header.displayName = "Header";
HeaderUnstyled.displayName = "HeaderUnstyled";
