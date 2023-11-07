import { Context, SQSEvent } from "aws-lambda";

import { syncImagesService } from "./syncImages.service";

import { logger } from "/opt/nodejs/configs/observability.config";

/**
 *
 * @param event {@link SQSEvent}
 * @param context {@link Context}
 * @description Lambda handler
 * @returns void
 */
export const lambdaHandler = async (event: SQSEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    await syncImagesService(event);
  } catch (error) {
    logger.error("error", { error });
    return error;
  }
};
