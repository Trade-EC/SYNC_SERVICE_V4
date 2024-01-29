import { APIGatewayProxyEvent } from "aws-lambda";

import { createVendorValidator } from "./createVendor.validator";
import { createVendorRepository } from "./createVendor.repository";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

export const createVendorService = async (event: APIGatewayProxyEvent) => {
  const { headers, body } = event;
  const { account: accountId } = headersValidator.parse(headers);
  const parseBody = JSON.parse(body ?? "");
  const validatedBody = createVendorValidator.parse(parseBody);

  await createVendorRepository(validatedBody, accountId);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Vendor created successfully"
    })
  };
};
