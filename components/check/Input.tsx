import { styled, useTheme } from "@material-ui/core/styles";
import { useRouter } from "next/router";
import { DetailedHTMLProps, InputHTMLAttributes, useState } from "react";

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  numberFormat?: Intl.NumberFormatOptions;
};

export const Input = styled(
  ({ className, defaultValue, numberFormat, style, ...props }: InputProps) => {
    const router = useRouter();
    const theme = useTheme();
    let formatter: Intl.NumberFormat;
    let initialValue;
    if (numberFormat) {
      formatter = new Intl.NumberFormat(router.locales, numberFormat);
      const numericDefaultValue = Number(defaultValue);
      initialValue =
        numericDefaultValue && !isNaN(numericDefaultValue)
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
        onBlur={(e) => {
          if (formatter) {
            const numericValue = Number(e.target.value);
            if (!isNaN(numericValue)) {
              setValue(formatter.format(numericValue));
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
          ...style,
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
  }
)`
  ${({ theme }) => `
    background: none;
    border: 0;
    color: currentColor;
    font: inherit;
    height: 100%;
    padding: ${theme.spacing(1, 2)};
    text-align: inherit;
    width: 100%;
  `}
`;
