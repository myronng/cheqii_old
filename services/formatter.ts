import { dinero, toFormat } from "dinero.js";
import { getCurrencyType } from "services/locale";
import { parseNumericValue } from "services/parser";

type formatType = (locale: string, value: number) => string;

export const formatCurrency: formatType = (locale, value) => {
  const dineroValue = dinero({
    amount: value,
    currency: getCurrencyType(locale),
  });
  return toFormat(dineroValue, ({ amount, currency }) => {
    const currencyFormatter = new Intl.NumberFormat(locale, {
      currency: currency.code,
      currencyDisplay: "narrowSymbol",
      style: "currency",
    });
    return currencyFormatter.format(amount);
  });
};

export const formatInteger: formatType = (locale, value) => {
  const numericValue = parseNumericValue(locale, value.toString());
  const integerFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    style: "decimal",
  });
  return !Number.isNaN(numericValue) && Number.isFinite(numericValue)
    ? integerFormatter.format(numericValue)
    : numericValue.toString();
};
