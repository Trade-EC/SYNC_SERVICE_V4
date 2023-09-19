import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { handleError } from "/opt/nodejs/utils/error.utils";

import { createProductsService } from "./createProducts.service";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const response = await createProductsService(event);
    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(e);
    return handleError(e);
  }
};
