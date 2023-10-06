import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { publishSyncService } from "./publishSync.service";

import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await publishSyncService(event);
    return response;
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
