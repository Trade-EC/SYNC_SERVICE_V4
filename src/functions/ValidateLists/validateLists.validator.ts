import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const queryParamsValidator = z.object({
  type: z.enum(["INCREMENTAL", "ALL"]).optional()
});
