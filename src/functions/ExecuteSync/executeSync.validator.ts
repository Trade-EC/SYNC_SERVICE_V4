import { z } from "/opt/nodejs/sync-service-layer/node_modules/zod";

import { APIGatewayProxyEvent } from "aws-lambda";

export const executeSyncValidator = z.object({
  accountId: z.string(),
  countryId: z.string(),
  vendorId: z.string(),
  status: z.enum(["SUCCESS", "ERROR"]),
  type: z.enum(["CHANNELS_STORES", "LISTS", "PRODUCTS"]),
  requestId: z.string().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional()
});

export const validateExecuteSync = (event: APIGatewayProxyEvent) => {
  const { body, headers } = event;
  const { account: accountId, country: countryId } = headers ?? {};
  const parsedBody = JSON.parse(body ?? "{}") as object;

  const validationResult = executeSyncValidator.parse({
    ...parsedBody,
    accountId,
    countryId
  });

  return validationResult;
};
