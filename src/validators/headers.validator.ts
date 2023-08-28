import { z } from "zod";

export const channelsAndStoresHeadersValidation = z.object({
  Accountid: z.string()
});
