import { z } from "zod";

export const accountValidator = z.object({
  accountId: z.string(),
  active: z.boolean(),
  description: z.string().optional(),
  isSyncActive: z.boolean(),
  name: z.string(),
  type: z.enum(["SERVICE"])
});
