import { APIGatewayProxyEvent } from "aws-lambda";

import { rollbackValidator } from "./rollback.validator";
import { rollbackProductsRepository } from "./rollback.repository";
import { rollbackShippingCostRepository } from "./rollback.repository";
import { rollbackStoresRepository } from "./rollback.repository";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const rollbackService = async (event: APIGatewayProxyEvent) => {
  const { headers, body } = event;
  const parsedBody = JSON.parse(body ?? "");
  const { account } = headersValidator.parse(headers);
  const info = rollbackValidator.parse(parsedBody);
  const { vendorId, type, version } = info;

  switch (type) {
    case "STORES":
      await rollbackStoresRepository(account, vendorId, version);
      await rollbackShippingCostRepository(account, vendorId, version);
      break;
    case "PRODUCTS":
      await rollbackProductsRepository(account, vendorId, version);
      break;
    default:
      throw new Error("Invalid type");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Rollback ${type} done`
    })
  };
};
