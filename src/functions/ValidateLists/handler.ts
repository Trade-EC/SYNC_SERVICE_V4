import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Context } from "aws-lambda";

import { validateListsService } from "./validateLists.service";

import { handleError } from "/opt/nodejs/sync-service-layer/utils/error.utils";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";
import { tracer } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import * as AWSXRay from "/opt/nodejs/sync-service-layer/node_modules/aws-xray-sdk-core";

/**
 *
 * @param event
 * @param context
 * @description Lambda handler
 * @returns {Promise<APIGatewayProxyResult>}
 */
const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  context.callbackWaitsForEmptyEventLoop = false;
  const segment = tracer.getSegment() as AWSXRay.Segment;
  const trace_id = tracer.getRootXrayTraceId();
  if (segment && trace_id) {
    segment.trace_id = trace_id;
  }

  let response;
  try {
    response = await validateListsService(event);
  } catch (e) {
    const error = handleError(e);
    logger.error("error", { error });
    response = error;
  }

  return response;
};

export const lambdaHandler = middyWrapper(handler);
