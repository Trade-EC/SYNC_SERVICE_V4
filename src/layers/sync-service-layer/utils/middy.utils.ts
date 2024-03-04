import { captureLambdaHandler } from "@aws-lambda-powertools/tracer";
import middy from "@middy/core";

import { tracer } from "../configs/observability.config";

export const middyWrapper = (handler: any) => {
  return middy(handler).use(captureLambdaHandler(tracer));
};
