import { SQSEvent } from "aws-lambda";

import { logger } from "/opt/nodejs/configs/observability.config";

import { createProductsService } from "./createProducts.service";
import { CreateProductsProps } from "./createProducts.types";

export const lambdaHandler = async (event: SQSEvent) => {
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
