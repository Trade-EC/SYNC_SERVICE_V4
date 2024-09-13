import { APIGatewayProxyEvent } from "aws-lambda";

import { callHttp, compareJsonProperties } from "./compareResponse.helpers";
import { bodyValidator } from "./compareResponse.validator";

/**
 *
 * @param event
 * @description Publish sync, save in S3 and in history collection
 * @returns void
 */
export const compareProductsService = async (event: APIGatewayProxyEvent) => {
  const { body } = event;
  const parsedBody = JSON.parse(body ?? "");
  const validatedBody = bodyValidator.parse(parsedBody);
  const { base, compare, options } = validatedBody;
  const { body: baseBody = null, headers: baseHeaders } = base;
  const { url: baseUrl, method: baseMethod } = base;
  const { body: compareBody = null, headers: compareHeaders } = compare;
  const { url: compareUrl, method: compareMethod } = compare;

  const [baseResponse, compareResponse] = await Promise.all([
    callHttp(baseUrl, baseBody, baseMethod, baseHeaders),
    callHttp(compareUrl, compareBody, compareMethod, compareHeaders)
  ]);

  const errors = compareJsonProperties(baseResponse, compareResponse, options);

  return { statusCode: 200, body: JSON.stringify(errors) };
};
