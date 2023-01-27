import { Security as SecurityIcon, VpnKey } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { EXTERNAL_AUTH_PROVIDERS } from "components/auth/AuthProviders";
import { redirect } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import {
  ValidateForm,
  ValidateFormProps,
  ValidateSubmitButton,
  ValidateSubmitButtonProps,
  ValidateTextField,
} from "components/ValidateForm";
import { BaseProps } from "declarations";
import { FirebaseError } from "firebase/app";
import { AuthErrorCodes, updatePassword } from "firebase/auth";
import { useState } from "react";
import { auth } from "services/firebase";

export const Security = styled((props: Pick<BaseProps, "className" | "strings">) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const [submitStatus, setSubmitStatus] = useState<ValidateSubmitButtonProps["status"]>("");
  // const confirmPasswordRef = useRef<ValidateTextFieldRef>(null);
  // const newPasswordRef = useRef<ValidateTextFieldRef>(null);

  // const handleConfirmPasswordBlur: ValidateTextFieldProps["onBlur"] = (e) => {
  //   if (newPasswordRef.current?.input) {
  //     if (
  //       newPasswordRef.current.input.value &&
  //       e.target.value !== newPasswordRef.current.input.value
  //     ) {
  //       newPasswordRef.current.input.setCustomValidity("passwordsMustMatch");
  //     } else {
  //       newPasswordRef.current.input.setCustomValidity("");
  //     }
  //     // Uses checkValidity state to not clear previously existing errors
  //     newPasswordRef.current.setError(!newPasswordRef.current.input.checkValidity());
  //   }
  // };

  // const handleConfirmPasswordChange: ChangeEventHandler<HTMLInputElement> = (e) => {
  //   if (newPasswordRef.current?.input) {
  //     if (
  //       newPasswordRef.current.input.value &&
  //       e.target.value !== newPasswordRef.current.input.value
  //     ) {
  //       newPasswordRef.current.input.setCustomValidity("passwordsMustMatch");
  //     } else {
  //       newPasswordRef.current.input.setCustomValidity("");
  //     }
  //   }
  // };

  const handleError = (err: unknown) => {
    setSubmitStatus("error");
    setSnackbar({
      active: true,
      message: err,
      type: "error",
    });
    setLoading({
      active: false,
      id: "securitySubmit",
    });
  };

  const handleFormSubmit: ValidateFormProps["onSubmit"] = async (e) => {
    try {
      setLoading({
        active: true,
        id: "securitySubmit",
      });
      if (auth.currentUser !== null) {
        const form = e.target as HTMLFormElement;
        const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
        // const confirmPassword = confirmPasswordRef.current?.input?.value;
        // const newPassword = newPasswordRef.current?.input?.value;
        await updatePassword(auth.currentUser, newPassword);
      }
      setSubmitStatus("success");
      setLoading({
        active: false,
        id: "securitySubmit",
      });
      setTimeout(() => {
        setSubmitStatus("");
      }, 2500);
    } catch (err) {
      if (err instanceof Error && err.name === "FirebaseError") {
        const typedError = err as FirebaseError;
        if (typedError.code === AuthErrorCodes.CREDENTIAL_TOO_OLD_LOGIN_AGAIN && auth.currentUser) {
          const authProvider = auth.currentUser.providerData[0].providerId;
          const currentProvider = EXTERNAL_AUTH_PROVIDERS[authProvider]?.provider;
          let query: URLSearchParams;
          if (typeof currentProvider !== "undefined") {
            query = new URLSearchParams({
              method: "provider",
              origin: "security",
            });
          } else {
            query = new URLSearchParams({
              method: "password",
              origin: "security",
            });
          }
          redirect(setLoading, `/reauth?${query}`, "/reauth");
        } else {
          handleError(typedError);
        }
      } else {
        handleError(err);
      }
    }
  };

  // const handleNewPasswordBlur: ValidateTextFieldProps["onBlur"] = (e) => {
  //   if (newPasswordRef.current && confirmPasswordRef.current?.input) {
  //     if (e.target.value && e.target.value !== confirmPasswordRef.current.input.value) {
  //       e.target.setCustomValidity("passwordsMustMatch");
  //     } else {
  //       e.target.setCustomValidity("");
  //     }
  //     newPasswordRef.current.setError(!e.target.checkValidity());
  //   }
  // };

  // const handleNewPasswordChange: ChangeEventHandler<HTMLInputElement> = (e) => {
  //   if (confirmPasswordRef.current?.input) {
  //     if (e.target.value && e.target.value !== confirmPasswordRef.current.input.value) {
  //       e.target.setCustomValidity("passwordsMustMatch");
  //     } else {
  //       e.target.setCustomValidity("");
  //     }
  //   }
  // };

  return (
    <ValidateForm className={`Security-root ${props.className}`} onSubmit={handleFormSubmit}>
      <Typography className="Security-heading" component="h2" variant="h2">
        <SecurityIcon fontSize="inherit" />
        <span>{props.strings["security"]}</span>
      </Typography>
      <Typography component="p" variant="h3">
        {props.strings["passwordHint"]}
      </Typography>
      {/* <ValidateTextField
        autoComplete="current-password"
        InputProps={{
          startAdornment: <VpnKey />,
        }}
        inputProps={{
          minLength: 2,
        }}
        label={props.strings["currentPassword"]}
        name="currentPassword"
        type="password"
      /> */}
      <ValidateTextField
        autoComplete="new-password"
        InputProps={{
          startAdornment: <VpnKey />,
        }}
        inputProps={{
          minLength: 8,
          maxLength: 64,
        }}
        // ref={newPasswordRef}
        label={props.strings["newPassword"]}
        name="newPassword"
        // onBlur={handleNewPasswordBlur}
        // onChange={handleNewPasswordChange}
        required={false}
        type="password"
      />
      {/* <ValidateTextField
        autoComplete="current-password"
        InputProps={{
          startAdornment: <VpnKey />,
        }}
        inputProps={{
          minLength: 2,
        }}
        ref={confirmPasswordRef}
        label={props.strings["confirmPassword"]}
        name="confirmPassword"
        onBlur={handleConfirmPasswordBlur}
        onChange={handleConfirmPasswordChange}
        type="password"
      /> */}
      <ValidateSubmitButton
        loading={loading.queue.includes("securitySubmit")}
        status={submitStatus}
        variant="outlined"
      >
        {props.strings["save"]}
      </ValidateSubmitButton>
    </ValidateForm>
  );
})`
  ${({ theme }) => `
    & .Security-heading {
      align-items: center;
      display: flex;

      & .MuiSvgIcon-root {
        margin-right: ${theme.spacing(2)};
      }
    }
  `}
`;

Security.displayName = "Security";
