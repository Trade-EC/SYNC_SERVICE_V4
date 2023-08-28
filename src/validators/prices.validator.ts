import { z } from "zod";

export const discountReferencesValidator = z.object({
  discountType: z.union([z.literal("PERCENTAGE"), z.literal("ABSOLUTE")]),
  value: z.number(),
  priority: z.number().int(),
  metadata: z.record(z.string(), z.any())
});

export const taxesReferenceValidator = z.object({
  name: z.string(),
  percentage: z.number()
});

export const pricedByUnitValidator = z.object({
  // Esto está bien?
  measurementType: z.string(),
  lengthUnit: z.string(),
  weightUnit: z.string(),
  volumeUnit: z.string()
});

export const pricesValidator = z.object({
  currency: z.string(),
  currencySymbol: z.string(),
  grossPrice: z.number(),
  discount: z.number(),
  priceBeforeTaxes: z.number(),
  taxes: z.number(),
  netPrice: z.number(),
  suggestedPrice: z.number(),
  points: z.number().int(),
  corePrice: z.number(), // cammelCase?
  containerDeposit: z.number(),
  discountReferences: z.array(discountReferencesValidator),
  taxesReferences: z.array(taxesReferenceValidator),
  pricedByUnit: pricedByUnitValidator
});

export const priceCategoryTaxesValidator = z.object({
  percentage: z.number(),
  name: z.string(),
  vatRateCode: z.number().int(),
  code: z.number().int(),
  vatRate: z.string()
});

export const priceCategoryValidator = z.object({
  category: z.union([z.literal("NORMAL"), z.literal("POINTS")]),
  symbol: z.string(),
  grossPrice: z.number(),
  netPrice: z.number(),
  taxes: priceCategoryTaxesValidator,
  discounts: z.array(z.string()),
  discountGrossPrice: z.number(),
  discountNetPrice: z.number(),
  discount: z.number()
});

export const priceCategoriesValidator = z.object({
  NORMAL: priceCategoryValidator,
  POINTS: priceCategoryValidator
});

export const oldPricesValidator = z
  .object({
    prices: priceCategoriesValidator
  })
  .catchall(z.record(z.string(), z.array(z.string())));
