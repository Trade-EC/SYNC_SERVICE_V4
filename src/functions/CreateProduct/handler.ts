import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";

import { createProductService } from "./createProduct.service";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

/**
 *
 * @param SQSEvent event
 * @param Context context
 * @description Lambda handler
 * @returns {Promise<void>}
 */
const handler = async (event: SQSEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const { Records } = event;
  const response: SQSBatchResponse = { batchItemFailures: [] };
  const recordPromises = Records.map(async record => {
    try {
      const { body: bodyRecord } = record ?? {};
      const props = JSON.parse(bodyRecord ?? "");
      await createProductService(props);
    } catch (error) {
      logger.error("PRODUCT: ERROR", { error });
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
      return error;
    }
  });
  await Promise.all(recordPromises);

  return response;
};

export const lambdaHandler = middyWrapper(handler).use(
  sqsExtendedClient.middleware()
);
