import { Context, SQSEvent } from "aws-lambda";

import { createProductsService } from "./createProducts.service";
import { CreateProductsProps } from "./createProducts.types";

import { logger } from "/opt/nodejs/configs/observability.config";

export const lambdaHandler = async (event: SQSEvent, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const { Records } = event;
    const [record] = Records;
    const { body: bodyRecord } = record ?? {};
    const props: CreateProductsProps = JSON.parse(bodyRecord ?? "");
    const { body, headers } = props;
    const { accountId } = headers;
    await createProductsService(body, accountId);
  } catch (error) {
    logger.error("creating stores error", { error });
    return error;
  }
};
