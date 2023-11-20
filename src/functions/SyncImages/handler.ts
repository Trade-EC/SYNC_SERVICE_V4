import { Context, SQSEvent } from "aws-lambda";

import { syncImagesService } from "./syncImages.service";

/**
 *
 * @param event {@link SQSEvent}
 * @param context {@link Context}
 * @description Lambda handler
 * @returns void
 */
export const lambdaHandler = async (event: SQSEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  return await syncImagesService(event);
};
