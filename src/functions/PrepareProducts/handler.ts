import { Context } from "aws-lambda";

import { prepareProductsService } from "./prepareProducts.service";
import { PrepareProductsPayload } from "./prepareProducts.types";

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
const handler = async (event: PrepareProductsPayload, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let response;

  try {
    await prepareProductsService(event);
  } catch (e) {
    response = handleError(e);
    logger.error("error", { response });
    return response;
  }
};

export const lambdaHandler = middyWrapper(handler);
