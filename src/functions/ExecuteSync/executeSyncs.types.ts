import { executeSyncValidator } from "./ExecuteSync.validator";

import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export type ExecuteSyncParams = z.infer<typeof executeSyncValidator>;
