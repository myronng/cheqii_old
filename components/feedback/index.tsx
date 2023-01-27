import { Button, Link, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Header } from "components/Header";
import { LinkButton } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import {
  ValidateForm,
  ValidateFormProps,
  ValidateRadioGroup,
  ValidateSubmitButton,
  ValidateTextField,
} from "components/ValidateForm";
import { FeedbackPageProps } from "pages/feedback";
import { useState } from "react";
import { interpolateString } from "services/formatter";

export const FeedbackPage = styled((props: FeedbackPageProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [ticket, setTicket] = useState<{ number: number; url: string } | null>(null);

  const handleFormSubmit: ValidateFormProps["onSubmit"] = async (e) => {
    try {
      setLoading({
        active: true,
        id: "feedbackSubmit",
      });
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/feedback", {
        body: JSON.stringify(Object.fromEntries(formData)),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const responseJson = await response.json();
      if (!response.ok) {
        throw new Error(responseJson.message);
      }
      setTicket(responseJson);
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({
        active: false,
        id: "feedbackSubmit",
      });
    }
  };

  return (
    <div className={props.className}>
      <Header
        disabledMenuItems={["sendFeedback"]}
        strings={props.strings}
        title={props.strings["sendFeedback"]}
      />
      <main className="Body-root">
        {ticket !== null ? (
          <div className="Body-submitted">
            <Typography component="span" variant="h3">
              <span>{props.strings["thankYouFeedback"]}</span>
              <Link href={ticket.url} target="_blank">
                {interpolateString(props.strings["trackTicket"], {
                  ticketNumber: ticket.number.toString(),
                })}
              </Link>
            </Typography>
            <div className="Body-actions">
              <LinkButton NextLinkProps={{ href: "/" }} variant="contained">
                {props.strings["goBack"]}
              </LinkButton>
            </div>
          </div>
        ) : (
          <ValidateForm className="Body-form" onSubmit={handleFormSubmit}>
            <ValidateRadioGroup
              className="Feedback-type"
              FormLabelProps={{ id: "feedbackTypeLabel", label: props.strings["feedbackType"] }}
              radioButtons={[
                { label: props.strings["suggestion"], value: "suggestion" },
                { label: props.strings["bugReport"], value: "bugReport" },
              ]}
              RadioGroupProps={{ name: "feedbackType" }}
            />
            <ValidateTextField
              disabled={loading.active}
              fullWidth
              inputProps={{ maxLength: 256 }}
              label={props.strings["title"]}
              name="title"
            />
            <ValidateTextField
              disabled={loading.active}
              fullWidth
              inputProps={{ maxLength: 10000 }}
              label={props.strings["message"]}
              minRows={8}
              multiline
              name="body"
            />
            <div className="Body-actions">
              <ValidateSubmitButton
                loading={loading.queue.includes("feedbackSubmit")}
                variant="contained"
              >
                {props.strings["send"]}
              </ValidateSubmitButton>
            </div>
          </ValidateForm>
        )}
      </main>
    </div>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100vh;

    & .Body-actions {
      display: flex;
      justify-content: flex-end;
    }

    & .Body-form {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(2)};
      justify-content: center;
      margin: auto;
      padding: ${theme.spacing(2)};

      ${theme.breakpoints.down("sm")} {
        width: 100%;
      }

      ${theme.breakpoints.up("sm")} {
        min-width: 600px;
      }
    }

    & .Body-root {
      background: ${theme.palette.background.secondary};
      border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};
      display: flex;
      flex: 1;
      overflow: auto;
    }

    & .Body-submitted {
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(4)};
      padding: ${theme.spacing(4)};
    }

    & .Feedback-type {
      padding: ${theme.spacing(0, 3)};
    }
  `}
`;
