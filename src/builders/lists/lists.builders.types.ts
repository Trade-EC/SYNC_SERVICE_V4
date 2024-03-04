import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { categoryValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { modifierOptionValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { modifierGroupValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { productValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";
import { listsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";

export type Lists = z.infer<typeof listsValidator>;
export type Category = z.infer<typeof categoryValidator>;
export type Product = z.infer<typeof productValidator>;
export type ModifierGroup = z.infer<typeof modifierGroupValidator>;
export type ModifierOption = z.infer<typeof modifierOptionValidator>;

export type Products = z.infer<typeof productsValidator>;
