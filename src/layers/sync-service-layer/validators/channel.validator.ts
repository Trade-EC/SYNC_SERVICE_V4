import { z } from "zod";

export const standardChannelValidator = z.object({
  channelId: z.string(),
  name: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  tags: z.string().array()
});
