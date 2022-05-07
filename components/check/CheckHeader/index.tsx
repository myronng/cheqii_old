import { ArrowBack, Settings } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Account } from "components/Account";
import { TitleTextField } from "components/check/CheckHeader/TitleTextField";
import { CheckSettings, CheckSettingsProps } from "components/check/CheckHeader/CheckSettings";
import { LinkIconButton } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { BaseProps, CheckSettings as CheckSettingsType } from "declarations";
import Head from "next/head";
import { Dispatch, memo, MouseEventHandler, SetStateAction, useState } from "react";

export type CheckHeaderProps = Pick<BaseProps, "className" | "strings"> & {
  accessLink: string;
  checkSettings: CheckSettingsType;
  checkId: string;
  onShareClick: MouseEventHandler<HTMLButtonElement>;
  setCheckSettings: Dispatch<SetStateAction<CheckSettingsType>>;
  unsubscribe: () => void;
  userAccess: CheckSettingsProps["userAccess"];
  writeAccess: boolean;
};

export const CheckHeader = styled(
  memo((props: CheckHeaderProps) => {
    const [checkSettingsOpen, setCheckSettingsOpen] = useState(false);
    const { loading } = useLoading();

    const handleSettingsDialogClose: CheckSettingsProps["onClose"] = (_e, _reason) => {
      setCheckSettingsOpen(false);
    };

    const handleSettingsDialogOpen: MouseEventHandler<HTMLButtonElement> = (_e) => {
      setCheckSettingsOpen(true);
    };

    return (
      <header className={`Header-root ${props.className}`}>
        <Head>
          <title>{props.checkSettings.title}</title>
        </Head>
        <LinkIconButton className="Header-back" NextLinkProps={{ href: "/" }}>
          <ArrowBack />
        </LinkIconButton>
        <TitleTextField
          checkId={props.checkId}
          className="Header-title"
          disabled={loading.active || !props.writeAccess}
          label={props.strings["name"]}
          setCheckSettings={props.setCheckSettings}
          size="small"
          value={props.checkSettings.title}
          variant="outlined"
          writeAccess={props.writeAccess}
        />
        <IconButton
          className="Header-settings"
          disabled={loading.active}
          onClick={handleSettingsDialogOpen}
        >
          <Settings />
        </IconButton>
        <Account onSignOut={props.unsubscribe} strings={props.strings} />
        <CheckSettings
          accessLink={props.accessLink}
          checkId={props.checkId}
          checkSettings={props.checkSettings}
          onClose={handleSettingsDialogClose}
          onShareClick={props.onShareClick}
          open={checkSettingsOpen}
          setCheckSettings={props.setCheckSettings}
          strings={props.strings}
          unsubscribe={props.unsubscribe}
          userAccess={props.userAccess}
          writeAccess={props.writeAccess}
        />
      </header>
    );
  })
)`
  ${({ theme }) => `
    display: flex;
    margin: ${theme.spacing(2)};

    & .Header-settings {
      margin-left: auto;
      margin-right: ${theme.spacing(2)};
    }

    & .Header-title {
      align-items: center;
      display: inline-flex;
      margin-left: ${theme.spacing(2)};
    }
  `}
`;

CheckHeader.displayName = "CheckHeader";
