import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Context } from "aws-lambda";

import { validateProductsService } from "./validateProducts.service";

import { handleError } from "/opt/nodejs/utils/error.utils";
import { logger } from "/opt/nodejs/configs/observability.config";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    const response = await validateProductsService(event);
    return response;
  } catch (e) {
    const error = handleError(e);
    logger.error("error", { error });
    return error;
  }
};
