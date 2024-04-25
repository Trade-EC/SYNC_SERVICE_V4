// Error utils
import { APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";

/**
 * @description Handle error and return APIGatewayProxyResult
 * @param e
 * @returns APIGatewayProxyResult
 */
export const handleError = (e: any): APIGatewayProxyResult => {
  let message: string = e.message;
  if (e.issues) {
    const zodError = new z.ZodError(e.issues);
    message = zodError.issues
      .map(
        issue => `Error in path [${issue.path.join(", ")}]: ${issue.message}\n`
      )
      .join(". ");
  }
  const enhancedMessage = {
    success: false,
    message
  };
  return { statusCode: 500, body: JSON.stringify(enhancedMessage) };
};
