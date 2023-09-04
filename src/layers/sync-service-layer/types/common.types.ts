import { z } from "zod";

import { taxesValidator } from "../validators/common.validator";
import { scheduleValidator } from "../validators/common.validator";

export type TaxInfo = z.infer<typeof taxesValidator>;

export type Schedule = z.infer<typeof scheduleValidator>;
