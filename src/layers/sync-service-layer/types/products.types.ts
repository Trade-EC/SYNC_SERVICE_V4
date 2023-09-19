import _ from "lodash";

import { Product, ModifierGroup, Category } from "./lists.types";

export interface TransformProductsProps {
  vendorId: string;
  storesId: string[];
  channelId: string;
  product: Product;
  modifierGroups: ModifierGroup[];
  products: Product[];
  categories: Category[];
}
