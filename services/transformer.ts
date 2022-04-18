import { Check, CheckDataForm, CheckDataServer, CheckSettings } from "declarations";
import { Currency } from "dinero.js";
import { formatCurrency, formatInteger } from "services/formatter";
import { parseCurrencyAmount, parseRatioAmount } from "services/parser";

type CheckDataToCheck = (
  locale: string,
  currency: Currency<number>,
  checkData: CheckDataForm
) => CheckDataServer;

type CheckToCheckStates = (
  locale: string,
  check: Check
) => { checkData: CheckDataForm; checkSettings: CheckSettings };

export const checkDataToCheck: CheckDataToCheck = (
  locale,
  currency,
  { contributors, items, title }
) => {
  const check: CheckDataServer = {
    contributors: contributors.map(({ name, ...contributor }) => ({
      ...contributor,
      name: name.dirty,
    })),
    items: items.map(({ buyer, cost, name, split, ...item }) => ({
      ...item,
      buyer: buyer.dirty,
      cost: parseCurrencyAmount(locale, currency, cost.dirty),
      name: name.dirty,
      split: split.map((amount) => parseRatioAmount(locale, amount.dirty)),
    })),
    title: title.dirty,
  };
  return check;
};

export const checkToCheckStates: CheckToCheckStates = (
  locale,
  { contributors, items, title, updatedAt, ...checkSettings }
) => {
  const checkData: CheckDataForm = {
    contributors: contributors.map(({ name, ...contributor }) => ({
      ...contributor,
      name: {
        clean: name,
        dirty: name,
      },
    })),
    items: items.map(({ buyer, cost, name, split, ...item }) => {
      const newCost = formatCurrency(locale, cost);
      return {
        ...item,
        buyer: {
          clean: buyer,
          dirty: buyer,
        },
        cost: {
          clean: newCost,
          dirty: newCost,
        },
        name: {
          clean: name,
          dirty: name,
        },
        split: split.map((amount) => {
          const newSplit = formatInteger(locale, amount);
          return {
            clean: newSplit,
            dirty: newSplit,
          };
        }),
      };
    }),
    title: {
      clean: title,
      dirty: title,
    },
  };
  return {
    checkData,
    checkSettings,
  };
};
