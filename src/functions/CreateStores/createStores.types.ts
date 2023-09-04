import { z } from "/opt/nodejs/node_modules/zod";

import { storeValidator } from "./createStores.validator";

export type Store = z.infer<typeof storeValidator>;
