import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import { LoadingButton, LoadingButtonProps } from "@mui/lab";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelProps,
  FormControlProps,
  FormLabel,
  FormLabelProps,
  // InputLabel,
  // Checkbox,
  // CheckboxProps,
  // FormControl,
  // FormControlLabel,
  // FormControlLabelProps,
  // FormControlProps,
  // InputLabel,
  // InputLabelProps,
  Radio,
  RadioGroup,
  RadioGroupProps,
  RadioProps,
  // Select,
  // SelectProps,
  TextField,
  TextFieldProps,
  Zoom,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps } from "declarations";
import {
  Dispatch,
  FocusEvent,
  FocusEventHandler,
  FormEvent,
  forwardRef,
  Key,
  MutableRefObject,
  ReactNode,
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

// type ValidateSelectProps<T> = Pick<BaseProps, "children"> &
//   FormControlProps & {
//     InputLabelProps?: InputLabelProps;
//     label?: string;
//     SelectProps?: Omit<SelectProps<T>, "onBlur"> & {
//       onBlur?: (e: FocusEvent<HTMLSelectElement>, hasError: boolean) => void;
//     };
//   };

type ValidateRadioGroupProps = FormControlProps & {
  FormLabelProps: FormLabelProps & {
    id: string;
    label: ReactNode;
  };
  radioButtons: (Omit<FormControlLabelProps, "control" | "value"> & {
    RadioProps?: RadioProps;
    value: FormControlLabelProps["value"];
  })[];
  RadioGroupProps?: RadioGroupProps;
};

export type ValidateTextFieldProps = Omit<TextFieldProps, "inputRef" | "onBlur"> & {
  inputRef?: MutableRefObject<ValidateTextFieldRefValue>;
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>, hasError: boolean) => void;
};

export type ValidateTextFieldRef = {
  error: boolean;
  input: ValidateTextFieldRefValue;
  setError: Dispatch<SetStateAction<boolean>>;
};

export type ValidateSubmitButtonProps = LoadingButtonProps & {
  status?: "" | "error" | "success";
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

export const ValidateRadioGroup = ({
  FormLabelProps: unfilteredFormLabelProps,
  radioButtons,
  RadioGroupProps,
  ...props
}: ValidateRadioGroupProps) => {
  const { loading } = useLoading();
  const [formControlError, setFormControlError] = useState(false);
  const { id, label, ...FormLabelProps } = unfilteredFormLabelProps;

  return (
    <FormControl error={formControlError} required {...props}>
      <FormLabel id={id} {...FormLabelProps}>
        {label}
      </FormLabel>
      <RadioGroup aria-labelledby={id} row {...RadioGroupProps}>
        {radioButtons.map(({ RadioProps: unfilteredRadioProps, ...FormControlLabelProps }) => {
          const { onBlur, ...RadioProps } = unfilteredRadioProps || {};
          const handleBlur: FocusEventHandler<HTMLButtonElement> = (e) => {
            const hasError = !e.target.checkValidity();
            setFormControlError(hasError);
            if (typeof onBlur === "function") {
              onBlur(e);
            }
          };

          return (
            <FormControlLabel
              control={<Radio onBlur={handleBlur} required {...RadioProps} />}
              disabled={loading.active}
              key={FormControlLabelProps.value as Key}
              {...FormControlLabelProps}
            />
          );
        })}
      </RadioGroup>
    </FormControl>
  );
};

export const ValidateSubmitButton = styled(
  ({ children, disabled, status, ...props }: ValidateSubmitButtonProps) => {
    const { loading } = useLoading();
    const showStatus = status === "success" || status === "error";

    let renderStatus;
    if (status === "error") {
      renderStatus = <ErrorOutline className="ValidateSubmitButton-status" />;
    } else {
      renderStatus = <CheckCircleOutline className="ValidateSubmitButton-status" />;
    }

    return (
      <LoadingButton
        color={status === "error" ? "error" : undefined}
        disabled={loading.active || disabled}
        type="submit"
        {...props}
      >
        <Zoom appear={false} in={!showStatus}>
          <span
            className={`ValidateSubmitButton-text ${showStatus ? "ValidateSubmitButton-hide" : ""}`}
          >
            {children}
          </span>
        </Zoom>
        <Zoom appear={false} in={showStatus}>
          {renderStatus}
        </Zoom>
      </LoadingButton>
    );
  }
)`
  ${({ theme }) => `
    position: relative;

    & .ValidateSubmitButton-status {
      position: absolute;
    }

    & .ValidateSubmitButton-hide {
      visibility: hidden; // Used for transition between loading.active = false and <Zoom in={true} />
    }
  `}
`;

// function UnstyledValidateSelect<T>({
//   children,
//   disabled,
//   InputLabelProps,
//   label,
//   required = true,
//   SelectProps = {},
//   ...props
// }: ValidateSelectProps<T>) {
//   const { loading } = useLoading();
//   const [selectError, setSelectError] = useState(false);

//   const { id, name, onBlur, ...filteredSelectProps } = SelectProps;
//   const selectId = id || name;

//   // Typing workaround for MUI's native select typing issues
//   const handleBlur: FocusEventHandler<HTMLElement> = (e) => {
//     const event = e as FocusEvent<HTMLSelectElement>;
//     const hasError = !event.target.checkValidity();
//     setSelectError(hasError);
//     if (typeof onBlur === "function") {
//       onBlur(event, hasError);
//     }
//   };

//   return (
//     <FormControl
//       disabled={loading.active || disabled}
//       error={selectError}
//       required={required}
//       {...props}
//     >
//       <InputLabel htmlFor={selectId} {...InputLabelProps}>
//         {label}
//       </InputLabel>
//       <Select
//         id={selectId}
//         label={label}
//         name={name}
//         native
//         onBlur={handleBlur}
//         {...filteredSelectProps}
//       >
//         {children}
//       </Select>
//     </FormControl>
//   );
// }

// export const ValidateSelect = styled(UnstyledValidateSelect)`
//   ${({ theme }) => `
//     & .MuiInputBase-root.MuiInputBase-adornedStart {
//       padding: 0;

//       & .MuiInputBase-input {
//         padding-left: 60px;
//         padding-right: ${theme.spacing(6)};
//         margin: 0;
//       }

//       // Should also target .MuiNativeSelect-icon
//       & .MuiSvgIcon-root {
//         pointer-events: none;

//         &:not(.MuiNativeSelect-icon) {
//           color: ${theme.palette.text.secondary};
//           position: absolute;
//           left: 22px;
//         }

//         &.MuiNativeSelect-icon {
//           right: 14px;
//         }
//       }
//     }
//   `}
// `;

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

    const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
      const hasError = !e.target.checkValidity();
      setTextFieldError(hasError);
      if (typeof onBlur === "function") {
        onBlur(e, hasError);
      }
    };

    return (
      <TextField
        disabled={loading.active || disabled}
        error={error || textFieldError}
        inputRef={inputRef}
        onBlur={handleBlur}
        required={required}
        {...props}
      />
    );
  }
);

export const ValidateTextField = styled(UnstyledValidateTextField)`
  ${({ theme }) => `
    & .MuiInputBase-root.MuiInputBase-adornedStart {
      padding: 0;

      & .MuiInputBase-input {
        padding-left: 60px;
        padding-right: ${theme.spacing(6)};
        margin: 0;
      }

      & .MuiSvgIcon-root {
        color: ${theme.palette.text.secondary};
        pointer-events: none;
        position: absolute;
        left: 22px;
      }
    }
  `}
`;

UnstyledValidateTextField.displayName = "UnstyledValidateTextField";
ValidateForm.displayName = "ValidateForm";
ValidateSubmitButton.displayName = "ValidateSubmitButton";
ValidateTextField.displayName = "ValidateTextField";
