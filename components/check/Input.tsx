import { styled, useTheme } from "@mui/material/styles";
import { useRouter } from "next/router";
import { ChangeEvent, DetailedHTMLProps, FocusEvent, InputHTMLAttributes } from "react";
import { formatCurrency, formatInteger } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { parseNumericValue } from "services/parser";

export type InputProps = DetailedHTMLProps<
  Omit<InputHTMLAttributes<HTMLInputElement>, "defaultValue">,
  HTMLInputElement
> & {
  defaultValue?: number | string;
  numberFormat?: "currency" | "integer";
};

export const Input = styled(({ className, defaultValue, numberFormat, ...props }: InputProps) => {
  const router = useRouter();
  const theme = useTheme();
  const locale = router.locale ?? router.defaultLocale!;
  const currency = getCurrencyType(locale);
  const isCurrencyFormat = numberFormat === "currency";
  let formatter: typeof formatCurrency | typeof formatInteger | undefined;
  if (isCurrencyFormat) {
    formatter = formatCurrency;
  } else if (numberFormat === "integer") {
    formatter = formatInteger;
  }
  let displayValue;
  if (formatter && typeof defaultValue === "number") {
    displayValue = formatter(locale, defaultValue);
  } else {
    displayValue = defaultValue ?? "";
  }
  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (formatter) {
      const numericValue = parseNumericValue(locale, e.target.value);
      const newValue = isCurrencyFormat
        ? Math.round(numericValue * Math.pow(currency.base, currency.exponent))
        : numericValue;
      e.target.dataset.value = newValue.toString();
      const newFormattedValue = formatter(locale, newValue);
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
    const target = e.target;
    if (formatter) {
      const numericValue = parseNumericValue(locale, e.target.value);
      target.value = numericValue.toString();
    }
    target.select();
    if (typeof props.onFocus === "function") {
      props.onFocus(e);
    }
  };

  return (
    <input
      {...props}
      className={`Input-root ${className}`}
      data-value={defaultValue}
      defaultValue={displayValue}
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
      style={{
        minWidth: `calc(${displayValue.toString().length || 0}ch + ${theme.spacing(4)} + 1px)`,
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
