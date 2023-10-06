import { z } from "zod";

import { taxesValidator } from "../validators/common.validator";
import { baseCategoryValidator } from "../validators/requestsLists.validator";
import { modifierGroupValidator } from "../validators/requestsLists.validator";
import { productPriceInfoValidator } from "../validators/requestsLists.validator";
import { productValidator } from "../validators/requestsLists.validator";

export type BaseCategory = z.infer<typeof baseCategoryValidator>;

export interface Category extends BaseCategory {
  childCategories?: Category[];
}

export type Product = z.infer<typeof productValidator>;
export type PriceInfo = z.infer<typeof productPriceInfoValidator>;
export type TaxesInfo = z.infer<typeof taxesValidator>;
export type ModifierGroup = z.infer<typeof modifierGroupValidator>;

export interface TransformProductsProps {
  vendorId: string;
  storesId: string[];
  channelId: string;
  accountId: string;
  product: Product;
  modifierGroups: ModifierGroup[];
  categories: Category[];
}
