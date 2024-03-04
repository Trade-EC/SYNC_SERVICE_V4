import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";

import { prepareProductsService } from "./prepareProducts.service";
import { PrepareProductsPayload } from "./prepareProducts.types";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

/**
 *
 * @param event
 * @param context
 * @description Lambda handler
 * @returns {Promise<APIGatewayProxyResult>}
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
      logger.info("PREPARE PRODUCTS:", { record });
      const { body: bodyRecord } = record ?? {};
      const props: PrepareProductsPayload = JSON.parse(bodyRecord ?? "");
      await prepareProductsService(props);
    } catch (error) {
      logger.error("PREPARE PRODUCTS ERROR:", { error });
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
