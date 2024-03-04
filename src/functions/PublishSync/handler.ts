import { SQSEvent, SQSBatchResponse } from "aws-lambda";
import { Context } from "aws-lambda";

import { publishSyncService } from "./publishSync.service";
import { publishSyncValidator } from "./publishSync.validator";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

/**
 *
 * @param event
 * @param context
 * @description Lambda handler
 * @returns APIGatewayProxyResult
 */
const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  context.callbackWaitsForEmptyEventLoop = false;
  const { Records } = event;
  const response: SQSBatchResponse = { batchItemFailures: [] };
  const recordPromises = Records.map(async record => {
    try {
      const { body: bodyRecord } = record;
      const props = JSON.parse(bodyRecord ?? "");
      const validateProps = await publishSyncValidator.parse(props);
      await publishSyncService(validateProps);
    } catch (e) {
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
      logger.error("error", { response });
      return e;
    }
  });

  await Promise.all(recordPromises);

  return response;
};

export const lambdaHandler = middyWrapper(handler).use(
  sqsExtendedClient.middleware()
);
