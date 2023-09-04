import { z } from "/opt/nodejs/node_modules/zod";

import { baseCategoryValidator } from "./createLists.validator";
import { productValidator } from "./createLists.validator";

export type Products = z.infer<typeof productValidator>;
export type Category = z.infer<typeof baseCategoryValidator>;
