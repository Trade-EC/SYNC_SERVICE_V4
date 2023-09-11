import { z } from "/opt/nodejs/node_modules/zod";

import { baseCategoryValidator } from "./createLists.validator";
import { modifierGroupValidator } from "./createLists.validator";
import { productPriceInfoValidator } from "./createLists.validator";
import { productValidator } from "./createLists.validator";

import { taxesValidator } from "/opt/nodejs/validators/common.validator";

export type Product = z.infer<typeof productValidator>;
export type BaseCategory = z.infer<typeof baseCategoryValidator>;
export type PriceInfo = z.infer<typeof productPriceInfoValidator>;
export type TaxesInfo = z.infer<typeof taxesValidator>;
export type ModifierGroup = z.infer<typeof modifierGroupValidator>;

export interface Category extends BaseCategory {
  childCategories?: Category[];
}

export interface TransformProductsProps {
  vendorId: string;
  storesId: string[];
  channelId: string;
  product: Product;
  modifierGroups: ModifierGroup[];
  products: Product[];
  categories: Category[];
}
