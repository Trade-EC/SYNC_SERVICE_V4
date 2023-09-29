import { SQSEvent } from "aws-lambda";

import { handleError } from "/opt/nodejs/utils/error.utils";

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
  } catch (e) {
    console.log(JSON.stringify(e));
    console.log(e);
    return handleError(e);
  }
};
