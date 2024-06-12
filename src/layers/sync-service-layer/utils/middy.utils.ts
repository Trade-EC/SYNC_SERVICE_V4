import { captureLambdaHandler } from "@aws-lambda-powertools/tracer/middleware";
import middy from "@middy/core";

import { tracer } from "../configs/observability.config";

export const middyWrapper = (handler: any) => {
  return middy(handler).use(captureLambdaHandler(tracer));
};
