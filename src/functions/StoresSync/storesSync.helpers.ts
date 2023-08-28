import { z } from "zod";

import { storeValidator } from "../../validators/store.validator";

export const storesRequestValidation = z.array(storeValidator);
