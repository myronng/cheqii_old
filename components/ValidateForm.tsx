import { TextField, TextFieldProps } from "@material-ui/core";
import { LoadingButton, LoadingButtonProps } from "@material-ui/lab";
import { FormEventHandler, ReactNode, useState } from "react";
import { useSnackbar } from "utilities/SnackbarContextProvider";

type ValidateFormProps = {
  children: ReactNode;
  className?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export type FormControlType =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

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
              if (control.checkValidity() === false) {
                control.focus();
                control.blur();
                if (typeof focusedElement === "undefined") {
                  focusedElement = control;
                }
              }
            });

            focusedElement!.focus();
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

export const ValidateSubmitButton = ({
  children,
  disabled,
  loading,
  ...props
}: LoadingButtonProps) => (
  <LoadingButton disabled={loading || disabled} loading={loading} type="submit" {...props}>
    {children}
  </LoadingButton>
);

export const ValidateTextField = ({ error, onBlur, ...props }: TextFieldProps) => {
  const [textFieldError, setTextFieldError] = useState(false);

  return (
    <TextField
      error={error || textFieldError}
      onBlur={(e) => {
        const isError = !e.target.checkValidity();
        setTextFieldError(isError);
        if (typeof onBlur === "function") {
          onBlur(e);
        }
      }}
      required
      {...props}
    />
  );
};
