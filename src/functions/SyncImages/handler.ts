import { SQSEvent } from "aws-lambda";

import { logger } from "/opt/nodejs/configs/observability.config";

import { syncImagesService } from "./syncImages.service";

export const lambdaHandler = async (event: SQSEvent) => {
  try {
    await syncImagesService(event);
  } catch (error) {
    logger.error("error", { error });
    return error;
  }
};
