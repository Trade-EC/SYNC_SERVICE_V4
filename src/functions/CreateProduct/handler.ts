import { Context } from "aws-lambda";

import { createProductService } from "./createProduct.service";
import { CreateProductProps } from "./createProduct.types";

import { logger } from "/opt/nodejs/configs/observability.config";

export const lambdaHandler = async (
  props: CreateProductProps,
  context: Context
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    return createProductService(props);
  } catch (error) {
    logger.error("creating stores error", { error });
    return error;
  }
};
