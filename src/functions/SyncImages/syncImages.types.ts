import { z } from "/opt/nodejs/node_modules/zod";
import { dbImageValidator } from "/opt/nodejs/validators/database.validator";

export type Image = z.infer<typeof dbImageValidator>;

export interface ImageSync extends Image {
  category: string;
}
