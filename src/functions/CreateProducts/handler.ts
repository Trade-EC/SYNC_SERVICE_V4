import { handleError } from "/opt/nodejs/utils/error.utils";

import { createProductsService } from "./createProducts.service";
import { CreateProductsProps } from "./createProducts.types";

export const lambdaHandler = async (props: CreateProductsProps) => {
  try {
    const { body, headers } = props;
    const { accountId } = headers;
    await createProductsService(body, accountId);
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(e);
    return handleError(e);
  }
};
