import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { publishSyncService } from "./publishSync.service";

import { handleError } from "/opt/nodejs/utils/error.utils";
import { logger } from "/opt/nodejs/configs/observability.config";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await publishSyncService(event);
    return response;
  } catch (e) {
    const error = handleError(e);
    logger.error("error", { error });
    return error;
  }
};
