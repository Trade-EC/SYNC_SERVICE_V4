import { APIGatewayProxyEvent } from "aws-lambda";

import { fetchProductsByVendorRepository } from "./fetchProductsByVendor.repository";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const fetchProductsByVendor = async (event: APIGatewayProxyEvent) => {
  const { queryStringParameters, pathParameters, headers } = event;
  const { account: accountId } = headersValidator.parse(headers);
  const { vendorId, channelId, storeId } = queryStringParameters ?? {};
  const { productId } = pathParameters ?? {};

  if (!vendorId || !accountId)
    throw new Error("AccountId or VendorId is required");

  const products = await fetchProductsByVendorRepository(
    accountId,
    vendorId,
    productId,
    channelId,
    storeId
  );

  const productResponse = products?.[0] ?? {};
  const productsResponse = products ?? [];

  return {
    statusCode: 200,
    body: JSON.stringify(productId ? productResponse : productsResponse)
  };
};
