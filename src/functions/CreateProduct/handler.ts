import { Context, SQSEvent } from "aws-lambda";

import { createProductService } from "./createProduct.service";

import { logger } from "/opt/nodejs/configs/observability.config";

export const lambdaHandler = async (event: SQSEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const { Records } = event;
    const recordPromises = Records.map(async record => {
      const { body: bodyRecord } = record ?? {};
      const props = JSON.parse(bodyRecord ?? "");

      await createProductService(props);
    });
    await Promise.all(recordPromises);
  } catch (error) {
    logger.error("creating product error", { error });
    return error;
  }
};
