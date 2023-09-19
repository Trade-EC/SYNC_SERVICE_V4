import { z } from "zod";

import { imageValidator } from "./common.validator";
import { scheduleValidator } from "./common.validator";
import { taxesValidator } from "./common.validator";
import { Category } from "../types/lists.types";

export const productPriceInfoValidator = z.object({
  price: z.number(),
  pointPrice: z.number().optional(),
  suggestedPrice: z.number().optional(),
  suggestedPointPrice: z.number().optional()
});

export const productModifier = z.object({
  modifierId: z.string().max(100),
  position: z.number().int()
});

export const productValidator = z.object({
  productId: z.string().max(100),
  name: z.string().max(100),
  description: z.string().max(512).optional().nullable(),
  standardTime: z.boolean().optional(),
  featured: z.boolean().optional(),
  modifierId: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  productModifiers: z.array(z.string().or(productModifier)).optional(),
  priceInfo: productPriceInfoValidator,
  taxInfo: taxesValidator.optional(),
  upselling: z.array(z.string()).optional(),
  crossSelling: z.array(z.string()).optional(),
  images: z.array(imageValidator).optional(),
  schedules: z.array(scheduleValidator).optional(),
  additionalInfo: z.record(z.string().min(1), z.any()).optional(),
  type: z.enum([
    "PRODUCT",
    "MODIFIER",
    "COMPLEMENT",
    "PRODUCTO",
    "MODIFICADOR",
    "COMPLEMENTO"
  ])
});

export const modifierOptionValidator = z.object({
  optionId: z.string().max(100),
  productId: z.string().max(100),
  position: z.number().int().optional(),
  default: z.boolean().or(z.number()).optional(),
  additionalInfo: z.record(z.string().min(1), z.any()).optional()
});

export const modifierGroupValidator = z.object({
  modifierId: z.string().max(100),
  modifier: z.string().max(200),
  position: z.number().int().optional(),
  minOptions: z.number().int(),
  maxOptions: z.number().int(),
  visible: z.boolean().optional(),
  type: z.enum([
    "RADIO",
    "CHECKBOX",
    "QUANTITY",
    "SELECT",
    "CUSTOMIZE",
    "SUPER_SIZE",
    "CUSTOMIZE_ADD",
    "CUSTOMIZE_SUBTRACT",
    "CUSTOM"
  ]),
  additionalInfo: z.record(z.string().min(1), z.any()).optional(),
  modifierOptions: z.array(modifierOptionValidator)
});

// TODO: Revisar en peticiones
export const listValidator = z.object({
  listId: z.string().max(100),
  listName: z.string().max(100),
  vendorId: z.string().max(100),
  storeId: z.string().or(z.literal("replicate_in_all")),
  channelId: z.string().max(100),
  ecommerceChannelId: z.string().optional(),
  channelReferenceName: z.string().optional(),
  schedules: z.array(scheduleValidator).optional()
});

export const productListingValidator = z.object({
  productId: z.string().max(100),
  position: z.number().int()
});

export const baseCategoryValidator = z.object({
  productCategoryId: z.string().max(100),
  name: z.string().max(100),
  displayInList: z.boolean(),
  featured: z.boolean().optional(),
  crossSellingCategory: z.boolean().optional(),
  position: z.number().int().optional(),
  images: z.array(imageValidator).max(1).optional(),
  productListing: z.array(productListingValidator),
  schedules: z.array(scheduleValidator).optional()
});

export const categoryValidator: z.ZodType<Category> =
  baseCategoryValidator.extend({
    childCategories: z.lazy(() => categoryValidator.array()).optional()
  });
