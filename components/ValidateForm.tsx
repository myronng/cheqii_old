import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import {
  // Checkbox,
  // CheckboxProps,
  // FormControl,
  // FormControlLabel,
  // FormControlLabelProps,
  // FormControlProps,
  // InputLabel,
  // InputLabelProps,
  // NativeSelect,
  // NativeSelectProps,
  TextField,
  TextFieldProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps } from "declarations";
import {
  Dispatch,
  FocusEvent,
  FormEvent,
  forwardRef,
  MutableRefObject,
  SetStateAction,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

// export type ValidateCheckboxProps = Omit<FormControlLabelProps, "control"> & {
//   CheckboxProps?: CheckboxProps;
// };

export type ValidateFormProps = Pick<BaseProps, "children" | "className"> & {
  onSubmit?: (e: FormEvent<HTMLFormElement>) => Promise<void>;
};

// type ValidateSelectProps = Pick<BaseProps, "children"> &
//   FormControlProps & {
//     InputLabelProps?: InputLabelProps;
//     label?: string;
//     SelectProps?: NativeSelectProps;
//   };

export type ValidateTextFieldProps = Omit<TextFieldProps, "inputRef" | "onBlur"> & {
  inputRef?: MutableRefObject<ValidateTextFieldRefValue>;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>, hasError: boolean) => void;
};

export type ValidateTextFieldRef = {
  error: boolean;
  input: ValidateTextFieldRefValue;
  setError: Dispatch<SetStateAction<boolean>>;
};

type ValidateTextFieldRefValue = HTMLInputElement | null;

export type FormControlType =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | undefined;

// export const ValidateCheckbox = ({ CheckboxProps, disabled, ...props }: ValidateCheckboxProps) => {
//   const { loading } = useLoading();

//   return (
//     <FormControlLabel
//       control={<Checkbox {...CheckboxProps} />}
//       disabled={loading.active || disabled}
//       {...props}
//     />
//   );
// };

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

// export const ValidateSelect = ({
//   children,
//   disabled,
//   InputLabelProps,
//   label,
//   SelectProps,
//   ...props
// }: ValidateSelectProps) => {
//   const { loading } = useLoading();

//   return (
//     <FormControl disabled={loading.active || disabled} {...props}>
//       <InputLabel {...InputLabelProps}>{label}</InputLabel>
//       <NativeSelect {...SelectProps}>{children}</NativeSelect>
//     </FormControl>
//   );
// };

const UnstyledValidateTextField = forwardRef<ValidateTextFieldRef, ValidateTextFieldProps>(
  ({ disabled, error, onBlur, required = true, ...props }, ref) => {
    const { loading } = useLoading();
    const [textFieldError, setTextFieldError] = useState(false);
    const inputRef = useRef<ValidateTextFieldRefValue>(null);

    useImperativeHandle(ref, () => ({
      error: textFieldError,
      input: inputRef?.current,
      setError: setTextFieldError,
    }));

    return (
      <TextField
        disabled={loading.active || disabled}
        error={error || textFieldError}
        inputRef={inputRef}
        onBlur={(e) => {
          const hasError = !e.target.checkValidity();
          setTextFieldError(hasError);
          if (typeof onBlur === "function") {
            onBlur(e, hasError);
          }
        }}
        required={required}
        {...props}
      />
    );
  }
);

export const ValidateTextField = styled(UnstyledValidateTextField)`
  ${({ theme }) => `
    & .MuiInputBase-root.MuiInputBase-adornedStart {
      & .MuiInputBase-input {
        border-bottom-left-radius: 0;
        border-top-left-radius: 0;
        padding-left: ${theme.spacing(1)};
        margin: 0;
      }

      & .MuiSvgIcon-root {
        color: ${theme.palette.text.secondary};
        margin: 0 ${theme.spacing(1)};
      }
    }
  `}
`;

UnstyledValidateTextField.displayName = "UnstyledValidateTextField";
ValidateForm.displayName = "ValidateForm";
ValidateSubmitButton.displayName = "ValidateSubmitButton";
ValidateTextField.displayName = "ValidateTextField";
