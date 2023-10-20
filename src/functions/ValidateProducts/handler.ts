import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { handleError } from "/opt/nodejs/utils/error.utils";
import { logger } from "/opt/nodejs/configs/observability.config";

import { validateProductsService } from "./validateProducts.service";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await validateProductsService(event);
    return response;
  } catch (e) {
    const error = handleError(e);
    logger.error("error", { error });
    return error;
  }
};
