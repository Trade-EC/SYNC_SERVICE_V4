import { publishSyncValidator } from "./publishSync.validator";

import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export type PublishSyncServiceProps = z.infer<typeof publishSyncValidator>;
