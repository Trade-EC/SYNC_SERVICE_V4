import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

import { fetchStoresByVendorRepository } from "./fetchStoresByVendor.repository";

/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const fetchStoresByVendorService = async (
  event: APIGatewayProxyEvent
) => {
  const { queryStringParameters, pathParameters, headers } = event;
  const { account: accountId } = headersValidator.parse(headers);
  const { vendorId } = queryStringParameters ?? {};
  const { skip = "0", limit = "10" } = queryStringParameters ?? {};
  const { status } = queryStringParameters ?? {};
  const { storeId } = pathParameters ?? {};

  if (!vendorId || !accountId)
    throw new Error("AccountId or VendorId is required");

  const stores = await fetchStoresByVendorRepository(
    accountId,
    vendorId,
    +skip,
    +limit,
    status,
    storeId
  );

  const { data } = stores;
  const storeResponse = data?.[0] ?? {};
  const storesResponse = stores ?? [];

  return {
    statusCode: 200,
    body: JSON.stringify(storeId ? storeResponse : storesResponse)
  };
};
