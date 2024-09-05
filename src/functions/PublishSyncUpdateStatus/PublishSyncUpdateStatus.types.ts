import { publishSyncUpStatusValidator } from "./PublishSyncUpdateStatus.validator";

import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export type PublishSyncUpStatusServiceProps = z.infer<
  typeof publishSyncUpStatusValidator
>;
