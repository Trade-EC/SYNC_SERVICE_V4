import { createProductService } from "./createProduct.service";
import { CreateProductProps } from "./createProduct.types";

import { logger } from "/opt/nodejs/configs/observability.config";

export const lambdaHandler = async (props: CreateProductProps) => {
  try {
    return createProductService(props);
  } catch (error) {
    logger.error("creating stores error", { error });
    return error;
  }
};
