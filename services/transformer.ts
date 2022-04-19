import { Check, CheckDataForm, CheckDataServer, CheckSettings } from "declarations";
import { Currency } from "dinero.js";
import { formatCurrency, formatInteger } from "services/formatter";
import { parseCurrencyAmount, parseRatioAmount } from "services/parser";

type CheckDataToCheck = (
  checkData: CheckDataForm,
  locale: string,
  currency: Currency<number>
) => CheckDataServer;

type CheckToCheckStates = (
  check: Check,
  locale: string
) => { checkData: CheckDataForm; checkSettings: CheckSettings };

type ContributorStateToContributor = (
  contributors: CheckDataForm["contributors"]
) => CheckDataServer["contributors"];

type ItemStateToItem = (
  items: CheckDataForm["items"],
  locale: string,
  currency: Currency<number>
) => CheckDataServer["items"];

export const checkDataToCheck: CheckDataToCheck = (
  { contributors, items, title },
  locale,
  currency
) => {
  const check: CheckDataServer = {
    contributors: contributorStateToContributor(contributors),
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
  { contributors, items, title, updatedAt, ...checkSettings },
  locale
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

export const contributorStateToContributor: ContributorStateToContributor = (contributors) =>
  contributors.map(({ name, ...contributor }) => ({
    ...contributor,
    name: name.dirty,
  }));

export const itemStateToItem: ItemStateToItem = (items, locale, currency) =>
  items.map(({ buyer, cost, name, split, ...item }) => ({
    ...item,
    buyer: buyer.dirty,
    cost: parseCurrencyAmount(locale, currency, cost.dirty),
    name: name.dirty,
    split: split.map((amount) => parseRatioAmount(locale, amount.dirty)),
  }));
