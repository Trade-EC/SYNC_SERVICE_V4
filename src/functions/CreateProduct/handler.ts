import { Context, SQSBatchResponse, SQSEvent } from "aws-lambda";

import { createProductService } from "./createProduct.service";
import { CreateProductProps } from "./createProduct.types";
import { errorCreateProduct } from "./createProduct.repository";

import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";
import { tracer } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import * as AWSXRay from "/opt/nodejs/sync-service-layer/node_modules/aws-xray-sdk-core";

/**
 *
 * @param SQSEvent event
 * @param Context context
 * @description Lambda handler
 * @returns {Promise<void>}
 */
const handler = async (event: SQSEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const segment = tracer.getSegment() as AWSXRay.Segment;
  const trace_id = tracer.getRootXrayTraceId();
  if (segment && trace_id) {
    segment.trace_id = trace_id;
  }

  const { Records } = event;
  const response: SQSBatchResponse = { batchItemFailures: [] };

  for (const record of Records) {
    const { body: bodyRecord } = record ?? {};
    const props: CreateProductProps = JSON.parse(bodyRecord ?? "");

    try {
      await createProductService(props);
    } catch (error) {
      logger.error("PRODUCT: ERROR", { error });
      try {
        await errorCreateProduct(props, error.message);
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
