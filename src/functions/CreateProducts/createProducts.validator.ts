import { z } from "/opt/nodejs/node_modules/zod";
import { categoryValidator } from "/opt/nodejs/validators/lists.validator";
import { listValidator } from "/opt/nodejs/validators/lists.validator";
import { modifierGroupValidator } from "/opt/nodejs/validators/lists.validator";
import { productValidator } from "/opt/nodejs/validators/lists.validator";

export const createProductsValidator = z.object({
  list: listValidator,
  products: z.array(productValidator),
  categories: z.array(categoryValidator),
  modifierGroups: z.array(modifierGroupValidator)
});
