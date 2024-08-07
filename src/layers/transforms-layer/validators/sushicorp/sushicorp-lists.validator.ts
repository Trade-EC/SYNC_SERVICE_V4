import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import {
  listValidator,
  modifierOptionValidator
} from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { modifierGroupValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";

const sushicorpModifierGroupOptionValidator = z.object({
  name: z.string().optional(),
  productId: z.coerce.string()
});

const sushicorpModifierGroupValidator = z.object({
  modifierOptions: modifierOptionValidator
    .merge(sushicorpModifierGroupOptionValidator)
    .array()
});

export const sushiCorpProductsValidator = z.object({
  modifierGroups: modifierGroupValidator
    .merge(sushicorpModifierGroupValidator)
    .array()
});

export const sushicorpListValidator = z.object({
  ecommerceChannelId: z.coerce.number().int().optional()
});

const sushicorpListsValidator = z.object({
  list: listValidator.merge(sushicorpListValidator),
  modifierGroups: modifierGroupValidator
    .merge(sushicorpModifierGroupValidator)
    .array()
    .nullable()
});

export const sCListsValidatorMerge = productsValidator
  .merge(sushicorpListsValidator)
  .superRefine((schema, ctx) => {
    const { products, categories, modifierGroups } = schema;

    const productIds = products.map(product => product.productId);
    const modifierGroupIds = modifierGroups?.map(
      modifierGroup => modifierGroup.modifierId
    );

    const productsInCategoriesSet = new Set<string>();
    categories.forEach(category =>
      category.productListing.forEach(product =>
        productsInCategoriesSet.add(product.productId)
      )
    );

    const nonExistProductsForCategories = [...productsInCategoriesSet].filter(
      productInCategory => !productIds.includes(productInCategory)
    );

    if (nonExistProductsForCategories.length > 0) {
      nonExistProductsForCategories.forEach(productId => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Categories: Product ${productId} non exist`
        });
      });
    }

    const modifiersInProductsSet = new Set<string>();
    products.forEach(product =>
      product.productModifiers?.forEach(productModifier => {
        if (typeof productModifier === "string") {
          modifiersInProductsSet.add(productModifier);
        }

        if (typeof productModifier === "object") {
          modifiersInProductsSet.add(productModifier.modifierId);
        }
      })
    );

    const nonExistModifiers = [...modifiersInProductsSet].filter(
      modifierId => !modifierGroupIds?.includes(modifierId)
    );

    if (nonExistModifiers.length > 0) {
      nonExistModifiers.forEach(modifierId => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Products: Modifier ${modifierId} non exist`
        });
      });
    }

    const productInModifierSet = new Set<string>();
    modifierGroups?.forEach(modifierGroup =>
      modifierGroup.modifierOptions.forEach((modifierOption: any) => {
        productInModifierSet.add(modifierOption.productId);
      })
    );

    const nonExistProductForModifier = [...productInModifierSet].filter(
      productId => !productIds.includes(productId)
    );

    if (nonExistProductForModifier.length > 0) {
      nonExistProductForModifier.forEach(productId => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ModifierGroup: Product ${productId} non exist`
        });
      });
    }
  });
