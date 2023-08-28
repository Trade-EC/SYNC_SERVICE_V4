import { z } from "zod";

import { categoryValidator } from "./categories.validator";
import { commonAttributesValidator, imageValidator } from "./common.validator";
import { translationValidator } from "./common.validator";
import { numberString } from "./custom.validator";
import { oldPricesValidator, pricesValidator } from "./prices.validator";

export const overridesValidator = z.object({
  contextType: z.string(),
  contextValue: z.string() // camelCase?
});

export const priceOverridesValidator = overridesValidator.extend({
  price: z.number(),
  corePrice: z.number()
});

export const pricedByUnitValidator = z.object({
  measurementType: z.string()
});

export const priceInfoValidator = z.object({
  price: z.number(),
  corePrice: z.number(),
  containerDeposit: z.number(),
  overrides: z.array(priceOverridesValidator),
  pricedByUnit: pricedByUnitValidator
});

export const quantityInfoValidator = z.object({
  minPermitted: z.number().int(),
  maxPermitted: z.number().int(),
  isMinPermittedOptional: z.boolean(),
  defaultQuantity: z.number().int(),
  chargeAbove: z.number().int(),
  refundUnder: z.number().int(),
  minPermittedUnique: z.number().int(),
  maxPermittedUnique: z.number().int()
});

export const suspensionInfoValidator = z.object({
  suspendUntil: z.number().int(),
  reason: z.string()
});

export const modifierGroupIdValidator = z.object({
  position: z.number().int(),
  modifierGroupId: z.string().uuid()
});

export const modifierGroupsIdsOverridesValidator = overridesValidator.extend({
  ids: z.array(modifierGroupIdValidator)
});

export const modifierGroupsIdsValidator = z.object({
  ids: z.array(modifierGroupIdValidator),
  overrides: z.array(modifierGroupsIdsOverridesValidator)
});

export const taxInfoValidator = z.object({
  taxRate: z.number(),
  vatRatePercentage: z.number()
});

export const bundledProductValidator = z.object({
  productId: z.string().uuid(),
  corePrice: z.number(),
  includedQuantity: z.number().int()
});

export const productsValidator = z.object({
  id: z.string().uuid(),
  name: z.string(),
  title: translationValidator,
  description: translationValidator,
  // description: z.string(), - duplicado
  type: z.union([z.literal("PRODUCT"), z.literal("MODIFIER")]),
  measure: z.string(),
  stock: z.number().int(),
  // manufacturer: z.array(z.string()), - Que es esto? De que tipo?
  coverUrl: z.string().url(),
  // additionalInfo:  - Que es??
  // tags - Que es??
  // upSelling - Que es??
  externalData: z.string(),
  isPriceVip: z.boolean(),
  hasModifiers: z.boolean(),
  attributes: commonAttributesValidator.extend({ Cantidad: numberString }),
  images: z.array(imageValidator),
  quantityInfo: quantityInfoValidator,
  suspensionInfo: suspensionInfoValidator,
  modifierGroupIds: modifierGroupsIdsValidator,
  taxInfo: taxInfoValidator,
  bundledProducts: z.array(bundledProductValidator),
  priceInfo: priceInfoValidator,
  categories: z.array(categoryValidator),
  pricesV4: z.array(pricesValidator),
  prices: z.array(oldPricesValidator)
});
