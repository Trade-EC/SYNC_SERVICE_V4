import { listValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { listsSuperRefine } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { categoryValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { modifierGroupValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { taxesValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

const horneroProductListValidator = z.object({
  taxInfo: taxesValidator.optional(),
  active: z.boolean()
});

const horneroModifierGroupValidator = z.object({
  type: z
    .enum([
      "RADIO",
      "CHECKBOX",
      "QUANTITY",
      "SELECT",
      "CUSTOMIZE",
      "SUPER_SIZE",
      "CUSTOMIZE_ADD",
      "CUSTOMIZE_SUBTRACT",
      "CUSTOM"
    ])
    .nullable()
});

const horneroProductsValidator = z.object({
  list: listValidator,
  products: productValidator.merge(horneroProductListValidator).array(),
  categories: categoryValidator.array(),
  modifierGroups: modifierGroupValidator
    .merge(horneroModifierGroupValidator)
    .array()
});

export const horneroListsValidatorMerge = productsValidator
  .merge(horneroProductsValidator)
  .superRefine(listsSuperRefine);
