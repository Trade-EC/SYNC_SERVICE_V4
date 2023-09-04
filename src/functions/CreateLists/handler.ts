import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { body, headers } = event;
    // const parsedBody = JSON.parse(body ?? "");
    console.log({ body, headers });

    return { statusCode: 200, body: "hello" };
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
