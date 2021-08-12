import { styled } from "@material-ui/core/styles";
import { useRouter } from "next/router";
import { DetailedHTMLProps, InputHTMLAttributes, useState } from "react";

export type InputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  numberFormat?: Intl.NumberFormatOptions;
};

export const Input = styled(({ defaultValue, numberFormat, style, ...props }: InputProps) => {
  const router = useRouter();
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
        width: `calc(${
          typeof value === "number"
            ? value.toString().length
            : typeof value === "string"
            ? value.length
            : "0"
        }ch + 1px)`,
      }}
      value={value}
    />
  );
})`
  background: none;
  border: 0;
  box-sizing: border-box;
  color: currentColor;
  font: inherit;
  outline: 0;
  padding: 0;
`;
