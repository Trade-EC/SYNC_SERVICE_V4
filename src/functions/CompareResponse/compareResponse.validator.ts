import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

export const requestValidator = z.object({
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  headers: z.record(z.string()).optional(),
  body: z.record(z.string(), z.any()).optional()
});

export const optionsValidator = z.object({
  wildcard: z.string().array().optional(),
  matchBy: z.string().optional()
});

export const bodyValidator = z.object({
  base: requestValidator,
  compare: requestValidator,
  options: optionsValidator.optional()
});
