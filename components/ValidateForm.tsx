import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import { TextField, TextFieldProps } from "@mui/material";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps } from "declarations";
import { FocusEventHandler, FormEventHandler, useState } from "react";

type ValidateFormProps = Pick<BaseProps, "children" | "className"> & {
  onSubmit?: FormEventHandler<HTMLFormElement>;
};

export type FormControlType =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | undefined;

export type ValidateTextFieldProps = {
  onError?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
} & TextFieldProps;

export const ValidateForm = (props: ValidateFormProps) => {
  const { setSnackbar } = useSnackbar();

  return (
    <form
      className={props.className}
      noValidate
      onSubmit={async (e) => {
        try {
          e.preventDefault();
          const formElement = e.target as HTMLFormElement;
          if (formElement.checkValidity() === true) {
            if (typeof props.onSubmit === "function") {
              await props.onSubmit(e);
            }
          } else {
            const formControl = Array.from(formElement.elements) as FormControlType[];
            let focusedElement: FormControlType;
            formControl.forEach((control) => {
              if (typeof control !== "undefined" && control.checkValidity() === false) {
                control.focus();
                control.blur();
                if (typeof focusedElement === "undefined") {
                  focusedElement = control;
                }
              }
            });

            if (typeof focusedElement !== "undefined") {
              focusedElement.focus();
            }
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      }}
    >
      {props.children}
    </form>
  );
};

export const ValidateSubmitButton = ({ children, disabled, ...props }: LoadingButtonProps) => {
  const { loading } = useLoading();

  return (
    <LoadingButton disabled={loading.active || disabled} type="submit" {...props}>
      {children}
    </LoadingButton>
  );
};

export const ValidateTextField = ({
  disabled,
  error,
  onBlur,
  onError,
  ...props
}: ValidateTextFieldProps) => {
  const { loading } = useLoading();
  const [textFieldError, setTextFieldError] = useState(false);

  return (
    <TextField
      disabled={loading.active || disabled}
      error={error || textFieldError}
      onBlur={(e) => {
        const isError = !e.target.checkValidity();
        setTextFieldError(isError);
        if (isError && typeof onError === "function") {
          onError(e);
        }
        if (typeof onBlur === "function") {
          onBlur(e);
        }
      }}
      required
      {...props}
    />
  );
};

ValidateForm.displayName = "ValidateForm";
ValidateSubmitButton.displayName = "ValidateSubmitButton";
ValidateTextField.displayName = "ValidateTextField";
