import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { syncListsService } from "./createLists.service";

import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await syncListsService(event);
    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
