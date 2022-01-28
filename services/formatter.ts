import { dinero, toFormat } from "dinero.js";
import { getCurrencyType } from "services/locale";
import { parseNumericValue } from "services/parser";

type Format = (locale: string, value: number) => string;
type Interpolate = (
  string: string,
  values: {
    [key: string]: string;
  }
) => string;

export const formatAccessLink: (
  restricted: boolean,
  checkId: string,
  inviteId: string
) => string = (restricted, checkId, inviteId) => {
  let accessUrl = "";
  if (typeof window !== "undefined") {
    const windowLocation = window.location;
    const windowOrigin = windowLocation.origin;
    if (restricted) {
      accessUrl = `${windowOrigin}/invite/${inviteId}/${checkId}`;
    } else {
      accessUrl = `${windowOrigin}${windowLocation.pathname}`;
    }
  }
  return accessUrl;
};

export const formatCurrency: Format = (locale, value) => {
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

export const formatRatio: Format = (locale, value) => {
  let numericValue = parseNumericValue(locale, value.toString());
  if (numericValue < 0) {
    numericValue = 0;
  }
  const integerFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    style: "decimal",
  });
  return !Number.isNaN(numericValue) && Number.isFinite(numericValue)
    ? integerFormatter.format(numericValue)
    : numericValue.toString();
};

export const interpolateString: Interpolate = (string, values) =>
  string.replace(/\{([^\{]+)\}/g, (match, key) => {
    const interpolatedString = typeof values[key] !== "undefined" ? values[key] : match;
    // Format the interpolated values if callback provided
    return interpolatedString;
  });
