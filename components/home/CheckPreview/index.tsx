import { Category, Person } from "@mui/icons-material";
import { AvatarGroup, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CheckPreviewType } from "components/home";
import { DateIndicator } from "components/home/DateIndicator";
import { LinkButton } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { UserAvatar } from "components/UserAvatar";
import { BaseProps } from "declarations";
import { add, dinero } from "dinero.js";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType, getLocale } from "services/locale";
import { parseDineroAmount } from "services/parser";

export type CheckPreviewProps = CheckPreviewType &
  Pick<BaseProps, "className" | "strings"> & {
    dateFormatter: Intl.DateTimeFormat;
  };

export const CheckPreview = styled((props: CheckPreviewProps) => {
  const router = useRouter();
  const { loading } = useLoading();
  const locale = getLocale(router);
  const currency = getCurrencyType(locale);

  const UserAvatars: ReactNode[] = [];
  props.data.owner.forEach((userId) => {
    const userData = props.data.users[userId];
    UserAvatars.push(
      <UserAvatar
        alt={userData.displayName ?? userData.email ?? undefined}
        key={userId}
        src={userData.photoURL}
      />
    );
  });
  props.data.editor.forEach((userId) => {
    const userData = props.data.users[userId];
    UserAvatars.push(
      <UserAvatar
        alt={userData.displayName ?? userData.email ?? undefined}
        key={userId}
        src={userData.photoURL}
      />
    );
  });
  props.data.viewer.forEach((userId) => {
    const userData = props.data.users[userId];
    UserAvatars.push(
      <UserAvatar
        alt={userData.displayName ?? userData.email ?? undefined}
        key={userId}
        src={userData.photoURL}
      />
    );
  });
  const totalCost = props.data.items.reduce(
    (totalCost, item) => add(totalCost, dinero({ amount: item.cost, currency })),
    dinero({ amount: 0, currency })
  );

  return (
    <LinkButton
      className={`CheckPreview-item ${loading.active ? "disabled" : ""} ${props.className}`}
      NextLinkProps={{ href: `/check/${props.id}` }}
    >
      <div className="CheckPreview-header">
        <Typography className="CheckPreview-title" component="h2" variant="h5">
          {props.data.title}
        </Typography>
        <DateIndicator
          className="CheckPreview-subtitle"
          dateTime={props.data.updatedAt}
          formatter={props.dateFormatter}
        />
      </div>
      <div className="CheckPreview-content">
        <AvatarGroup max={5}>{UserAvatars}</AvatarGroup>
        <div className="CheckDigest-root">
          <div className="CheckDigest-item">
            <Person />
            <Typography>{props.data.contributors.length}</Typography>
          </div>
          <Typography className="CheckDigest-separator">•</Typography>
          <div className="CheckDigest-item">
            <Category />
            <Typography>{props.data.items.length}</Typography>
          </div>
          <Typography className="CheckDigest-separator">•</Typography>
          <div className="CheckDigest-item">
            <Typography>{formatCurrency(locale, parseDineroAmount(totalCost))}</Typography>
          </div>
        </div>
      </div>
    </LinkButton>
  );
})`
  ${({ theme }) => `
    align-items: normal;
    backdrop-filter: blur(1px); // Used to hide hover background-transparency
    background: ${
      theme.palette.background.default
    }; // Makes background transition consistent with InsertSlot
    border: 2px solid ${theme.palette.primary[theme.palette.mode]};
    flex-direction: column;
    justify-content: normal;
    height: 100%;
    padding: 0;
    width: 100%;

    &.disabled {
      background: ${theme.palette.action.disabledBackground};
      border-color: ${theme.palette.action.disabled};
      pointer-events: none;

      & .MuiAvatarGroup-root .MuiAvatar-root {
        border-color: ${theme.palette.action.disabled};
      }

      & .CheckDigest-root {
        border-color: ${theme.palette.action.disabled};
      }
    }

    & .CheckDigest-root {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: ${theme.spacing(2)};
      margin-right: auto;

      & .CheckDigest-item {
        align-items: center;
        display: flex;

        & .MuiSvgIcon-root {
          margin-right: ${theme.spacing(1)};
        }
      }
    }

    & .CheckPreview-content {
      color: ${theme.palette.text.primary};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(2)};
      width: 100%;
    }

    & .CheckPreview-header {
      border-bottom: 2px solid ${theme.palette.divider};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      overflow: hidden; // Needed for text-overflow styling in title
      padding: ${theme.spacing(2)};
      width: 100%;

      & .CheckPreview-subtitle {
        align-items: center;
        color: ${theme.palette.text.disabled};
        display: flex;

        & .MuiSvgIcon-root {
          margin-right: ${theme.spacing(1)};
        }
      }

      & .CheckPreview-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    & .MuiAvatarGroup-root {
      justify-content: flex-end;

      & .MuiAvatar-root {
        border-color: ${theme.palette.primary[theme.palette.mode]};
      }
    }
  `}
`;

CheckPreview.displayName = "CheckPreview";
