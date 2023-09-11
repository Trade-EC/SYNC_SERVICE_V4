import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { syncStoresService } from "./createStores.service";

import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await syncStoresService(event);
    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(e);
    return handleError(e);
  }
};
