import { z } from "/opt/nodejs/node_modules/zod";

import { listsValidator } from "./validateLists.validator";

export type Lists = z.infer<typeof listsValidator>;
