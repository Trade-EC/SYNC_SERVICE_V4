import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Context } from "aws-lambda";

import { validateProductsService } from "./validateProducts.service";

import { handleError } from "/opt/nodejs/sync-service-layer/utils/error.utils";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";

const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  let response;
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    response = await validateProductsService(event);
  } catch (e) {
    const error = handleError(e);
    logger.error("error", { error });
    response = error;
  }

  return response;
};

export const lambdaHandler = middyWrapper(handler);
