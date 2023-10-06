import { z } from "/opt/nodejs/node_modules/zod";
import { productsValidator } from "/opt/nodejs/validators/requestsLists.validator";

export type Lists = z.infer<typeof productsValidator>;
