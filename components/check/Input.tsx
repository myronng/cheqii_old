import { styled, useTheme } from "@material-ui/core/styles";
import { ChangeEvent, DetailedHTMLProps, FocusEvent, InputHTMLAttributes } from "react";
import { useCurrencyFormat, useIntegerFormat, useStripNumberFormat } from "services/formatter";

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  numberFormat?: "currency" | "integer";
};

export const Input = styled(({ className, defaultValue, numberFormat, ...props }: InputProps) => {
  const theme = useTheme();
  const formatCurrency = useCurrencyFormat();
  const formatInteger = useIntegerFormat();
  const stripNumberFormat = useStripNumberFormat();
  let formatter: typeof formatCurrency | typeof formatInteger | undefined;
  if (numberFormat === "currency") {
    formatter = formatCurrency;
  } else if (numberFormat === "integer") {
    formatter = formatInteger;
  }
  let initialValue: InputHTMLAttributes<HTMLInputElement>["defaultValue"];
  if (formatter) {
    initialValue = formatter(defaultValue);
  } else {
    initialValue = defaultValue || "";
  }
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (formatter) {
      const newValue = stripNumberFormat(e.target.value).toString();
      e.target.dataset.value = newValue;
      const newFormattedValue = formatter(newValue);
      e.target.value = newFormattedValue;
      e.target.style.minWidth = `calc(${newFormattedValue.length}ch + ${theme.spacing(4)} + 1px)`;
    }
    if (typeof props.onBlur === "function") {
      props.onBlur(e);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.target.style.minWidth = `calc(${e.target.value.length}ch + ${theme.spacing(4)} + 1px)`;
    if (typeof props.onChange === "function") {
      props.onChange(e);
    }
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (typeof props.onFocus === "function") {
      props.onFocus(e);
    }
  };

  return (
    <input
      {...props}
      className={`Input-root ${className}`}
      data-value={defaultValue}
      defaultValue={initialValue}
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
      style={{
        minWidth: `calc(${initialValue.toString().length || 0}ch + ${theme.spacing(4)} + 1px)`,
      }}
    />
  );
})`
  ${({ theme }) => `
    appearance: none;
    background: none;
    border: 0;
    font: inherit;
    height: 100%;
    padding: ${theme.spacing(1, 2)};
    text-align: inherit;
    width: 100%;

    &:disabled {
      color: ${theme.palette.action.disabled};
    }

    &:focus-visible {
      outline: 2px solid ${theme.palette.primary.main};
    }

    &:not(:disabled) {
      color: currentColor;
    }
  `}
`;
