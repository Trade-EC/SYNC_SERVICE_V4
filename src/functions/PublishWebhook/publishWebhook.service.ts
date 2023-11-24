import { APIGatewayProxyEvent } from "aws-lambda";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";

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
  logger.appendKeys(info);
  logger.info("PUBLISH WEBHOOK: INIT");

  const response = savePublishRequest(info);
  return response;
};
