import { z } from "/opt/nodejs/node_modules/zod";

import { Category } from "./createLists.types";

import { taxesValidator } from "/opt/nodejs/validators/common.validator";
import { imageValidator } from "/opt/nodejs/validators/common.validator";
import { scheduleValidator } from "/opt/nodejs/validators/common.validator";

export const productPriceInfoValidator = z.object({
  price: z.number(),
  pointPrice: z.number().optional(),
  suggestedPrice: z.number().optional(),
  suggestedPointPrice: z.number().optional()
});

export const productModifier = z.object({
  modifierId: z.string().max(45),
  position: z.number().int()
});

export const productValidator = z.object({
  productId: z.string().max(45),
  name: z.string().max(100),
  description: z.string().max(512).optional(),
  // TODO: verificar requerido
  standardTime: z.boolean().optional(),
  // standardTime: z.boolean(),
  featured: z.boolean().optional(),
  modifierId: z.string().max(45).optional(),
  tags: z.array(z.string()).optional(),
  productModifiers: z.array(z.string().or(productModifier)),
  // TODO: Es un array, verificar
  // priceInfo: z.array(productPriceInfoValidator),
  priceInfo: productPriceInfoValidator,
  taxInfo: taxesValidator.optional(),
  upselling: z.array(z.string()).optional(),
  crossSelling: z.array(z.string()).optional(),
  images: z.array(imageValidator).optional(),
  schedules: z.array(scheduleValidator).optional(),
  additionalInfo: z.record(z.string().min(1), z.any()).optional(),
  type: z.union([
    z.literal("PRODUCT"),
    z.literal("MODIFIER"),
    z.literal("COMPLEMENT"),
    z.literal("PRODUCTO"),
    z.literal("MODIFICADOR"),
    z.literal("COMPLEMENTO")
  ])
});

export const modifierOptionValidator = z.object({
  optionId: z.string().max(45),
  productId: z.string().max(45),
  position: z.number().int().optional(),
  //TODO: Verificar si es requerido
  default: z.boolean().or(z.number()).optional(),
  // default: z.boolean().or(z.number()),
  additionalInfo: z.record(z.string().min(1), z.any()).optional()
});

export const modifierGroupValidator = z.object({
  modifierId: z.string().max(45),
  modifier: z.string().max(200),
  position: z.number().int().optional(),
  minOptions: z.number().int(),
  maxOptions: z.number().int(),
  // // TODO: verificar requerido
  visible: z.boolean().optional(),
  // visible: z.boolean(),
  type: z.union([
    z.literal("RADIO"),
    z.literal("CHECKBOX"),
    z.literal("QUANTITY"),
    z.literal("SELECT"),
    z.literal("CUSTOMIZE"),
    z.literal("SUPER_SIZE"),
    z.literal("CUSTOMIZE_ADD"),
    z.literal("CUSTOMIZE_SUBTRACT"),
    // TODO: Verificar todos los tipos de modifiers
    z.literal("CUSTOM")
  ]),
  additionalInfo: z.record(z.string().min(1), z.any()).optional(),
  modifierOptions: z.array(modifierOptionValidator)
});

// TODO: Revisar en peticiones
export const listValidator = z.object({
  listId: z.string().max(45),
  listName: z.string().max(45),
  vendorId: z.string().max(45),
  storeId: z.string().or(z.literal("replicate_in_all")),
  channelId: z.string().max(45),
  ecommerceChannelId: z.string().optional(),
  channelReferenceName: z.string().optional(),
  schedules: z.array(scheduleValidator).optional()
});

export const productListingValidator = z.object({
  productId: z.string().max(45),
  position: z.number().int()
});

export const baseCategoryValidator = z.object({
  productCategoryId: z.string().max(45),
  name: z.string().max(100),
  displayInList: z.boolean(),
  feature: z.boolean().optional(),
  crossSellingCategory: z.boolean().optional(),
  position: z.number().int().optional(),
  images: z.array(imageValidator).max(1).optional(),
  productListing: z.array(productListingValidator)
});

export const categoryValidator: z.ZodType<Category> =
  baseCategoryValidator.extend({
    childCategories: z.lazy(() => categoryValidator.array()).optional()
  });
