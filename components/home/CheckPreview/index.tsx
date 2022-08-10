import { Category, Person } from "@mui/icons-material";
import { AvatarGroup, Card, CardContent, CardHeader, Typography } from "@mui/material";
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
import { getCurrencyType } from "services/locale";
import { parseDineroAmount } from "services/parser";

export type CheckPreviewProps = CheckPreviewType &
  Pick<BaseProps, "className" | "strings"> & {
    dateFormatter: Intl.DateTimeFormat;
  };

export const CheckPreview = styled((props: CheckPreviewProps) => {
  const router = useRouter();
  const { loading } = useLoading();
  const locale = router.locale ?? String(router.defaultLocale);
  const currency = getCurrencyType(locale);

  const UserAvatars: ReactNode[] = [];
  props.data.owner.forEach((userId) => {
    const userData = props.data.users[userId];
    UserAvatars.push(
      <UserAvatar
        alt={userData.displayName ?? userData.email ?? undefined}
        key={userId}
        src={userData.photoURL}
        strings={props.strings}
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
        strings={props.strings}
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
        strings={props.strings}
      />
    );
  });
  const totalCost = props.data.items.reduce(
    (totalCost, item) => add(totalCost, dinero({ amount: item.cost, currency })),
    dinero({ amount: 0, currency })
  );

  return (
    <Card
      className={`CheckPreview-item ${loading.active ? "disabled" : ""} ${props.className}`}
      component="article"
    >
      <LinkButton className="CheckPreview-button" NextLinkProps={{ href: `/check/${props.id}` }}>
        <CardHeader
          disableTypography
          subheader={
            <DateIndicator
              className="CheckPreview-subtitle"
              dateTime={props.data.updatedAt}
              formatter={props.dateFormatter}
            />
          }
          title={
            <Typography className="CheckPreview-title" component="h2" variant="h5">
              {props.data.title}
            </Typography>
          }
        />
        <CardContent>
          <AvatarGroup max={5}>{UserAvatars}</AvatarGroup>
          <div className="CheckDigest-root">
            <div className="CheckDigest-item">
              <Person />
              <Typography>{props.data.contributors.length}</Typography>
            </div>
            <Typography>•</Typography>
            <div className="CheckDigest-item">
              <Category />
              <Typography>{props.data.items.length}</Typography>
            </div>
            <Typography>•</Typography>
            <div className="CheckDigest-item">
              <Typography>{formatCurrency(locale, parseDineroAmount(totalCost))}</Typography>
            </div>
          </div>
        </CardContent>
      </LinkButton>
    </Card>
  );
})`
  ${({ theme }) => `

  &.disabled {
    background: ${theme.palette.action.disabledBackground};
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
    background: ${theme.palette.action.hover};
    border: 2px solid ${theme.palette.primary[theme.palette.mode]};
    border-radius: ${theme.shape.borderRadius}px;
    display: flex;
    gap: ${theme.spacing(2)};
    margin-right: auto;
    padding: ${theme.spacing(0.5, 1)};

    & .CheckDigest-item {
      align-items: center;
      display: flex;

      & .MuiSvgIcon-root {
        margin-right: ${theme.spacing(1)};
      }
    }
  }

  & .CheckPreview-button {
    flex-direction: column;
    height: 100%;
    padding: 0;
    width: 100%;

    & .MuiCardHeader-root {
      border-bottom: 2px solid ${theme.palette.divider};
      width: 100%;
    }

    & .MuiCardHeader-content {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      overflow: hidden; // Needed for text-overflow styling in title
    }

    & .CheckPreview-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    & .CheckPreview-subtitle {
      align-items: center;
      color: ${theme.palette.text.disabled};
      display: flex;

      & .MuiSvgIcon-root {
        margin-right: ${theme.spacing(1)};
      }
    }

    & .MuiCardContent-root {
      color: ${theme.palette.text.primary};
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(2)}; // Overrides last-child padding when disabled
      width: 100%;
    }
  }

  & .MuiAvatarGroup-root {
    justify-content: flex-end;

    & .MuiAvatar-root {
      border-color: ${theme.palette.primary.main};
    }
  }
`}
`;

CheckPreview.displayName = "CheckPreview";
