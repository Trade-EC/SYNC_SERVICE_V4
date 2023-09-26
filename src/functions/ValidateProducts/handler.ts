import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { handleError } from "/opt/nodejs/utils/error.utils";

import { validateProductsService } from "./validateProducts.service";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await validateProductsService(event);
    return response;
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
