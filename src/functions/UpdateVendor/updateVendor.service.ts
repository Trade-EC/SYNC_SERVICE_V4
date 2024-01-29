import { APIGatewayProxyEvent } from "aws-lambda";

import { updateVendorPathParameterValidator } from "./updateVendor.validator";
import { updateVendorValidator } from "./updateVendor.validator";
import { updateVendorRepository } from "./updateVendor.repository";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

export const updateVendorService = async (event: APIGatewayProxyEvent) => {
  const { headers, body, pathParameters } = event;
  const { account: accountId } = headersValidator.parse(headers);
  const parseBody = JSON.parse(body ?? "");
  const validatedBody = updateVendorValidator.parse(parseBody);
  const { vendorId } = updateVendorPathParameterValidator.parse(
    pathParameters ?? {}
  );

  await updateVendorRepository(validatedBody, accountId, vendorId);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Vendor updated successfully"
    })
  };
};
