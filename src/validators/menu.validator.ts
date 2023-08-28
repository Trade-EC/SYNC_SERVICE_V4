import { z } from "zod";

import { productsValidator } from "./products.validator";

export const menuValidator = z.object({
  // catalogues vacío
  // categories vacío
  // modifierGroups vacío
  products: productsValidator
});
