import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { listsValidator } from "/opt/nodejs/sync-service-layer/validators/lists.validator";

export type Lists = z.infer<typeof listsValidator>;
