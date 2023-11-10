import { APIGatewayProxyEvent } from "aws-lambda";

import { savePublishRequest } from "./publishWebhook.repository";
import { publishWebhookValidator } from "./publishWebhook.validator";

/**
 *
 * @param event
 * @description Publish sync, save in S3 and in history collection
 * @returns void
 */
export const publishWebhookService = async (event: APIGatewayProxyEvent) => {
  const { body } = event;
  const parsedBody = JSON.parse(body ?? "");
  const info = publishWebhookValidator.parse(parsedBody);
  const { vendorId, accountId, status } = info;

  const response = savePublishRequest(vendorId, accountId, status);
  return response;
};
