import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";

import { syncStoresService } from "./createStores.service";
import { CreateStoreProps } from "./createStores.types";
import { errorCreateStore } from "./createStores.repository";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { tracer } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import * as AWSXRay from "/opt/nodejs/sync-service-layer/node_modules/aws-xray-sdk-core";

const handler = async (
  event: SQSEvent,
  context: Context
): Promise<SQSBatchResponse> => {
  context.callbackWaitsForEmptyEventLoop = false;
  const segment = tracer.getSegment() as AWSXRay.Segment;
  const trace_id = tracer.getRootXrayTraceId();
  if (segment && trace_id) {
    segment.trace_id = trace_id;
  }

  const { Records } = event;
  const response: SQSBatchResponse = { batchItemFailures: [] };
  for (const record of Records) {
    logger.info("STORE:", { record });
    const { body: bodyRecord } = record ?? {};
    const props: CreateStoreProps = JSON.parse(bodyRecord ?? "");
    try {
      await syncStoresService(props);
    } catch (error) {
      logger.error("STORE ERROR:", { error });
      try {
        await errorCreateStore(props, error.message);
      } catch (error) {
        logger.error("ERROR SYNC REQUEST: ERROR", { error });
      }
      response.batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }
  return response;
};

export const lambdaHandler = middyWrapper(handler).use(
  sqsExtendedClient.middleware()
);
