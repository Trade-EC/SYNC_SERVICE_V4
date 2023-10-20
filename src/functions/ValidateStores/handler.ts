import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { validateStoresService } from "./validateStores.service";

import { handleError } from "/opt/nodejs/utils/error.utils";
import { logger } from "/opt/nodejs/configs/observability.config";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await validateStoresService(event);
    return response;
  } catch (e) {
    const error = handleError(e);
    logger.error("error", { error });
    return error;
  }
};
