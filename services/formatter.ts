import { dinero, toFormat } from "dinero.js";
import { getCurrencyType } from "services/locale";
import { isNumber } from "services/parser";

type Format = (locale: string, value: number) => string;
type InterpolateString = (
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
  const integerFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    style: "decimal",
  });
  return isNumber(value) ? integerFormatter.format(value) : Number(0).toString();
};

export const interpolateString: InterpolateString = (string, values) =>
  string.replace(/\{([^\{]+)\}/g, (match, key) => {
    const interpolatedString = typeof values[key] !== "undefined" ? values[key] : match;
    // Format the interpolated values if callback provided
    return interpolatedString;
  });
