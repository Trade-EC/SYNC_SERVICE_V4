import {
  modifierOptionValidator,
  productsValidator
} from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productPriceInfoValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { baseCategoryValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { listValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { modifierGroupValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productListingValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { taxesValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

const kfcListValidator = z.object({
  vendorId: z.number(),
  ecommerceChannelId: z.string().optional(),
  channelReferenceName: z.string().optional(),
  stores: z.string().nullable(),
  replicateInAll: z.coerce.boolean().optional()
});

const kfcProductValidator = z.object({
  active: z.boolean().optional(),
  productId: z.number().int(),
  priceInfo: productPriceInfoValidator.array(),
  taxInfo: taxesValidator.array().optional(),
  tags: z.string().optional(),
  upselling: z.string().optional()
});

const kfcProductListingValidator = z.object({
  productId: z.number().int()
});

const kfcBaseCategoryValidator = baseCategoryValidator.merge(
  z.object({
    productListing: productListingValidator
      .merge(kfcProductListingValidator)
      .array()
  })
);

type KfcBaseCategory = z.infer<typeof kfcBaseCategoryValidator>;

interface KfcCategory extends KfcBaseCategory {
  childCategories?: KfcCategory[];
}

const kfcCategoryValidator: z.ZodType<KfcCategory> =
  kfcBaseCategoryValidator.extend({
    childCategories: z.lazy(() => kfcCategoryValidator.array()).optional()
  });

const kfcModifierGroupOptionValidator = z.object({
  name: z.string(),
  productId: z.number().int()
});

const kfcModifierGroupValidator = z.object({
  modifierOptions: modifierOptionValidator
    .merge(kfcModifierGroupOptionValidator)
    .array()
});

const kfcProductsValidator = z.object({
  list: listValidator.merge(kfcListValidator).array(),
  products: productValidator.merge(kfcProductValidator).array(),
  categories: kfcCategoryValidator.array(),
  modifierGroups: modifierGroupValidator
    .merge(kfcModifierGroupValidator)
    .array()
});

export const kfcListsValidatorMerge = productsValidator
  .merge(kfcProductsValidator)
  .superRefine((schema, ctx) => {
    const { products, categories, modifierGroups } = schema;

    const productIds = products.map(product => product.productId);
    const modifierGroupIds = modifierGroups.map(
      modifierGroup => modifierGroup.modifierId
    );

    const productsInCategoriesSet = new Set<number>();
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
      modifierId => !modifierGroupIds.includes(modifierId)
    );

    if (nonExistModifiers.length > 0) {
      nonExistModifiers.forEach(modifierId => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Products: Modifier ${modifierId} non exist`
        });
      });
    }

    const productInModifierSet = new Set<number>();
    modifierGroups.forEach(modifierGroup =>
      modifierGroup.modifierOptions.forEach(modifierOption => {
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
  })
  .array();
