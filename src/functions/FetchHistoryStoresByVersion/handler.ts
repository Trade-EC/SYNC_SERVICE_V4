import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Context } from "aws-lambda";

import { fetchHistoryStoresByVersionService } from "./fetchHistoryStoresByVersion.service";

import { handleError } from "/opt/nodejs/sync-service-layer/utils/error.utils";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";

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
  let response;

  try {
    response = await fetchHistoryStoresByVersionService(event);
  } catch (e) {
    response = handleError(e);
    logger.error("error", { response });
  }

  return response;
};

export const lambdaHandler = middyWrapper(handler);