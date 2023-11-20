import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";

import { createProductService } from "./createProduct.service";

import { logger } from "/opt/nodejs/configs/observability.config";

/**
 *
 * @param SQSEvent event
 * @param Context context
 * @description Lambda handler
 * @returns {Promise<void>}
 */
export const lambdaHandler = async (event: SQSEvent, context: Context) => {
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
