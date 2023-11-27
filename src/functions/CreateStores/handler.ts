import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";

import { syncStoresService } from "./createStores.service";
import { CreateStoreProps } from "./createStores.types";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";

const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  context.callbackWaitsForEmptyEventLoop = false;

  const { Records } = event;
  const response: SQSBatchResponse = { batchItemFailures: [] };
  const recordPromises = Records.map(async record => {
    try {
      logger.info("STORE:", { record });
      const { body: bodyRecord } = record ?? {};
      const props: CreateStoreProps = JSON.parse(bodyRecord ?? "");
      await syncStoresService(props);
    } catch (error) {
      logger.error("STORE ERROR:", { error });
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
      return error;
    }
  });

  await Promise.all(recordPromises);
  return response;
};

export const lambdaHandler = middyWrapper(handler);
