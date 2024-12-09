import { modifierOptionValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productPriceInfoValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { baseCategoryValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { listValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { modifierGroupValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productListingValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { taxesValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

import { kfcPreprocessArray } from "./kfc-common.validator";
import { isUndefined } from "../../../sync-service-layer/utils/common.utils";

const kfcListValidator = z.object({
  vendorId: z.number(),
  storeId: z.number().int().or(z.string()),
  ecommerceChannelId: z.string().optional(),
  channelReferenceName: z.string().optional(),
  stores: z.string().nullable().optional(),
  replicateInAll: z.coerce.boolean().optional()
});

const nullableToNumber = z
  .number()
  .nullable()
  .transform(value => (value === null ? 0 : value));

const kfcListProductPriceInfoValidator = productPriceInfoValidator.merge(
  z.object({
    pointPrice: nullableToNumber.optional(),
    suggestedPrice: nullableToNumber.optional(),
    suggestedPointPrice: nullableToNumber.optional()
  })
);

const kfcProductListValidator = z.object({
  active: z.boolean().optional(),
  productId: z.number().int(),
  priceInfo: kfcListProductPriceInfoValidator.array(),
  tags: z.string().optional(),
  upselling: z.string().optional()
});

const kfcImageValidator = z.object({
  imageCategoryId: z.string().max(45).or(z.number().int()),
  fileUrl: z.string().nullable()
});

const kfcProductValidator = kfcProductListValidator.merge(
  z.object({
    priceInfo: kfcListProductPriceInfoValidator,
    images: z.array(kfcImageValidator).optional()
  })
);

const kfcProductListingValidator = z.object({
  productId: z.number().int()
});

const kfcBaseCategoryValidator = baseCategoryValidator.merge(
  z.object({
    productListing: productListingValidator
      .merge(kfcProductListingValidator)
      .array(),
    images: z.array(kfcImageValidator).max(1).nullable().optional()
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
  name: z.string().optional(),
  productId: z.number().int().optional(),
  optionId: z.string().max(100).optional()
});

const kfcModifierGroupValidator = z.object({
  modifierOptions: kfcPreprocessArray(
    modifierOptionValidator.merge(kfcModifierGroupOptionValidator).array()
  )
});

const kfcProductModifierGroupValidator = z.object({
  name: z.string(),
  optionId: z.string(),
  productId: z.number().int()
});

// -KFC PRODUCTS VALIDATOR
export const kfcProductsValidator = z.object({
  list: listValidator.merge(kfcListValidator),
  products: productValidator.merge(kfcProductValidator).array(),
  categories: kfcCategoryValidator.array(),
  modifierGroups: modifierGroupValidator
    .omit({ modifierOptions: true })
    .merge(kfcProductModifierGroupValidator)
    .array()
    .nullable()
});

const kfcListsValidator = z.object({
  list: listValidator.merge(kfcListValidator).array(),
  products: productValidator.merge(kfcProductListValidator).array(),
  categories: kfcCategoryValidator.array(),
  modifierGroups: modifierGroupValidator
    .merge(kfcModifierGroupValidator)
    .array()
    .nullable()
});

// -KFC LIST VALIDATOR
export const kfcListsValidatorMerge = productsValidator
  .merge(kfcListsValidator)
  .superRefine((schema, ctx) => {
    const { products, categories, modifierGroups } = schema;

    const productIds = products.map(product => product.productId);
    const modifierGroupIds = modifierGroups?.map(
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

    const productInModifierSet = new Set<number>();
    modifierGroups?.forEach(modifierGroup =>
      modifierGroup.modifierOptions.forEach((modifierOption: any) => {
        productInModifierSet.add(modifierOption.productId);
      })
    );

    const nonExistProductForModifier = [...productInModifierSet].filter(
      productId =>
        !isUndefined(productId) ? !productIds.includes(productId) : false
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
