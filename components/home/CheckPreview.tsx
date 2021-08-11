import { Card, CardHeader, Typography } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { Update } from "@material-ui/icons";
import { LinkButton } from "components/Link";
import { Check, StyledProps } from "declarations";

export type CheckPreviewProps = StyledProps & {
  checks: Check[];
};

export const CheckPreview = styled((props: CheckPreviewProps) => {
  const checkPreviews = props.checks?.map((check) => {
    const timestamp = new Date(check.modifiedAt!);
    const dateFormatter = Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "2-digit",
      hour12: false,
      year: "numeric",
    });
    return (
      <Card className="CheckPreview-item" component="article" key={check.id}>
        <LinkButton className="CheckPreview-button" NextLinkProps={{ href: `/check/${check.id}` }}>
          <CardHeader
            disableTypography
            subheader={
              <div className="MuiCardHeader-subheader">
                <Update />
                <Typography component="time" dateTime={timestamp.toISOString()} variant="subtitle1">
                  {dateFormatter.format(timestamp)}
                </Typography>
              </div>
            }
            title={
              <Typography component="p" variant="h5">
                {check.name}
              </Typography>
            }
          />
        </LinkButton>
      </Card>
    );
  });
  return <section className={`CheckPreview-root ${props.className}`}>{checkPreviews}</section>;
})`
  ${({ theme }) => `
    display: flex;
    flex-wrap: wrap;

    & .CheckPreview-item {
      margin: ${theme.spacing(1)};

      & .CheckPreview-button {
        height: 100%;
        width: 100%;

        & .MuiCardHeader-subheader {
          align-items: center;
          color: ${theme.palette.action.disabled};
          display: flex;
          margin-top: ${theme.spacing(0.5)};

          & .MuiSvgIcon-root {
            margin-right: ${theme.spacing(1)};
          }
        }
      }
    }
  `}
`;
