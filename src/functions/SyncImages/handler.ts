import { Context, SQSEvent } from "aws-lambda";

import { syncImagesService } from "./syncImages.service";

import { middyWrapper } from "/opt/nodejs/sync-service-layer/utils/middy.utils";

/**
 *
 * @param event {@link SQSEvent}
 * @param context {@link Context}
 * @description Lambda handler
 * @returns void
 */
const handler = async (event: SQSEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const response = await syncImagesService(event);

  return response;
};

export const lambdaHandler = middyWrapper(handler);
