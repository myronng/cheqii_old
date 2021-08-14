import { styled, useTheme } from "@material-ui/core/styles";
import { useRouter } from "next/router";
import { DetailedHTMLProps, InputHTMLAttributes, useState } from "react";

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  numberFormat?: Intl.NumberFormatOptions;
};

export const Input = styled(({ className, defaultValue, numberFormat, ...props }: InputProps) => {
  const router = useRouter();
  const theme = useTheme();
  let formatter: Intl.NumberFormat;
  let initialValue;
  if (numberFormat) {
    formatter = new Intl.NumberFormat(router.locales, numberFormat);
    const numericDefaultValue = Number(defaultValue);
    initialValue =
      !Number.isNaN(numericDefaultValue) && Number.isFinite(numericDefaultValue)
        ? formatter.format(numericDefaultValue)
        : defaultValue;
  } else {
    initialValue = defaultValue;
  }

  const [value, setValue] = useState(initialValue);

  return (
    <input
      {...props}
      className={`Input-root ${className}`}
      data-value={defaultValue}
      onBlur={(e) => {
        if (formatter) {
          let stringValue = e.target.value;
          const parts = formatter.formatToParts(11111.1);
          for (let part of parts) {
            if (
              part.type === "currency" ||
              part.type === "group" ||
              part.type === "literal" ||
              part.type === "percentSign" ||
              part.type === "unit"
            ) {
              stringValue = stringValue.replace(new RegExp(`\\${part.value}`, "g"), "");
            } else if (part.type === "decimal") {
              stringValue = stringValue.replace(new RegExp(`\\${part.value}`), ".");
            }
          }
          const numericValue = Number(stringValue);
          if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
            e.target.dataset.value = stringValue;
            setValue(formatter.format(numericValue));
          } else {
            e.target.dataset.value = "0";
            setValue(formatter.format(0));
          }
        }
        if (typeof props.onBlur === "function") {
          props.onBlur(e);
        }
      }}
      onChange={(e) => {
        setValue(e.target.value);
        if (typeof props.onChange === "function") {
          props.onChange(e);
        }
      }}
      onFocus={(e) => {
        e.target.select();
        if (typeof props.onFocus === "function") {
          props.onFocus(e);
        }
      }}
      style={{
        minWidth: `calc(${
          typeof value === "number"
            ? value.toString().length
            : typeof value === "string"
            ? value.length
            : "0"
        }ch + ${theme.spacing(4)} + 1px)`,
      }}
      value={value}
    />
  );
})`
  ${({ theme }) => `
    background: none;
    border: 0;
    color: currentColor;
    font: inherit;
    height: 100%;
    padding: ${theme.spacing(1, 2)};
    text-align: inherit;
    width: 100%;

    &:focus-visible {
      outline: 2px solid ${theme.palette.primary.main};
    }
  `}
`;
