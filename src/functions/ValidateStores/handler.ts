import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { handleError } from "/opt/nodejs/utils/error.utils";

import { validateStoresService } from "./validateStores.service";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await validateStoresService(event);
    return response;
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
