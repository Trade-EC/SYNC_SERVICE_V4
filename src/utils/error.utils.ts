// Error utils
import { APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";

export const handleError = (e: any): APIGatewayProxyResult => {
  let message: string = e.message;
  if (e instanceof z.ZodError) {
    message = e.issues.map(issue => issue.message).join(". ");
  }
  return { statusCode: 500, body: JSON.stringify({ message }) };
};
