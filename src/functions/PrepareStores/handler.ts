import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";

import { prepareStoreService } from "./prepareStores.service";
import { PrepareStoresPayload } from "./prepareStores.types";

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
      logger.info("PREPARE STORES:", { record });
      const { body: bodyRecord } = record ?? {};
      const props: PrepareStoresPayload = JSON.parse(bodyRecord ?? "");
      await prepareStoreService(props);
    } catch (error) {
      logger.error("PREPARE STORES ERROR:", { error });
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
