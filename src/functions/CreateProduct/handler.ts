import { createProductService } from "./createProduct.service";
import { CreateProductProps } from "./createProduct.types";

import { handleError } from "/opt/nodejs/utils/error.utils";

export const lambdaHandler = async (props: CreateProductProps) => {
  try {
    return createProductService(props);
  } catch (e) {
    console.log(JSON.stringify(e));
    return handleError(e);
  }
};
