import { TextField, TextFieldProps } from "@material-ui/core";
import { LoadingButton, LoadingButtonProps } from "@material-ui/lab";
import { FormEventHandler, ReactNode, useState } from "react";

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

export const ValidateForm = (props: ValidateFormProps) => (
  <form
    className={props.className}
    noValidate
    onSubmit={(e) => {
      e.preventDefault();
      const formElement = e.target as HTMLFormElement;
      if (formElement.checkValidity() === true) {
        if (typeof props.onSubmit === "function") {
          props.onSubmit(e);
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
    }}
  >
    {props.children}
  </form>
);

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
