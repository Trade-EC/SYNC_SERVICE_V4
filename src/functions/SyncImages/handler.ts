import { SQSEvent } from "aws-lambda";

import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (event: SQSEvent) => {
  try {
    console.log(JSON.stringify({ event }));
    return { statusCode: 200, body: JSON.stringify(event) };
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
