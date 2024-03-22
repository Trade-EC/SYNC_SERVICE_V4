import { z } from "zod";

import { taxesValidator } from "../validators/common.validator";
import { baseCategoryValidator } from "../validators/lists.validator";
import { modifierGroupValidator } from "../validators/lists.validator";
import { productPriceInfoValidator } from "../validators/lists.validator";
import { productValidator } from "../validators/lists.validator";

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
  countryId: string;
  product: Product;
  modifierGroups: ModifierGroup[];
  categories: Category[];
}
