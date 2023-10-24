import { Context, SQSEvent } from "aws-lambda";

import { syncImagesService } from "./syncImages.service";

import { logger } from "/opt/nodejs/configs/observability.config";

export const lambdaHandler = async (event: SQSEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    await syncImagesService(event);
  } catch (error) {
    logger.error("error", { error });
    return error;
  }
};
