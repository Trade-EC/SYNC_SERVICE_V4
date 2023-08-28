import { z } from "zod";

import { storeValidator } from "../validators/store.validator";

export type Store = z.infer<typeof storeValidator>;
