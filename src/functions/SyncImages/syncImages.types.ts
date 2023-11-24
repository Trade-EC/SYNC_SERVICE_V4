import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";
import { dbImageValidator } from "/opt/nodejs/sync-service-layer/validators/database.validator";

export type Image = z.infer<typeof dbImageValidator>;

export interface ImageSync extends Image {
  category: string;
}
