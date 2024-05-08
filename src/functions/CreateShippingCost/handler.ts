import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";

import { CreateShippingCostProps } from "./createShippingCost.types";
import { syncShippingCostService } from "./createShippingCost.service";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  context.callbackWaitsForEmptyEventLoop = false;

  const { Records } = event;
  const response: SQSBatchResponse = { batchItemFailures: [] };

  for (const record of Records) {
    try {
      logger.info("SHIPPING COST:", { record });
      const { body: bodyRecord } = record ?? {};
      const props: CreateShippingCostProps = JSON.parse(bodyRecord ?? "");
      await syncShippingCostService(props);
    } catch (error) {
      logger.error("SHIPPING COST ERROR:", { error });
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
      return error;
    }
  }
  return response;
};

export const lambdaHandler = middyWrapper(handler).use(
  sqsExtendedClient.middleware()
);
