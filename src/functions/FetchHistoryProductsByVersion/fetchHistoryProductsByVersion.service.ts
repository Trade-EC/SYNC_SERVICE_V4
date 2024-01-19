import { APIGatewayProxyEvent } from "aws-lambda";

import { fetchHistoryProductsByVersionRepository } from "./fetchHistoryProductsByVersion.repository";
import { fetchHistoryProductsByVersionValidator } from "./fetchHistoryProductsByVersion.validator";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const fetchHistoryStoresByVersionService = async (
  event: APIGatewayProxyEvent
) => {
  const { headers, queryStringParameters } = event;
  const { account } = headersValidator.parse(headers);
  const info = fetchHistoryProductsByVersionValidator.parse(
    queryStringParameters ?? {}
  );
  const { vendorId, version, skip = 0, limit = 10 } = info;

  const data = await fetchHistoryProductsByVersionRepository(
    account,
    vendorId,
    version,
    skip,
    limit
  );

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
