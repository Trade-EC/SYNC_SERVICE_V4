import { z } from "zod";

import { accountValidator } from "../validators/account.validator";

export type Account = z.infer<typeof accountValidator>;
