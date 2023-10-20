import { z } from "zod";

import { Product, ModifierGroup, Category } from "./lists.types";
import { dbProductValidator } from "../validators/database.validator";
import { dbCategoryValidator } from "../validators/database.validator";
import { dbQuestionsValidator } from "../validators/database.validator";

export interface TransformProductsProps {
  vendorId: string;
  storesId: string[];
  channelId: string;
  product: Product;
  modifierGroups: ModifierGroup[];
  products: Product[];
  categories: Category[];
}

export type DbProduct = z.infer<typeof dbProductValidator>;
export type DbQuestion = z.infer<typeof dbQuestionsValidator>;
export type DbCategory = z.infer<typeof dbCategoryValidator>;
