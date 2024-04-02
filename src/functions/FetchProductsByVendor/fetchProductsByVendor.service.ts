import { APIGatewayProxyEvent } from "aws-lambda";

import { fetchProductsByVendorRepository } from "./fetchProductsByVendor.repository";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { fetchMapAccount } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";

/**
 *
 * @param event
 * @description Fetch stores by vendor service
 * @returns {Promise<{statusCode: number, body: string}>}
 */
export const fetchProductsByVendor = async (event: APIGatewayProxyEvent) => {
  const { queryStringParameters, pathParameters, headers } = event;
  const { account: requestAccountId } = headersValidator.parse(headers);
  const { vendorId, channelId, storeId } = queryStringParameters ?? {};
  const { skip = "0", limit = "10" } = queryStringParameters ?? {};
  const { status = "DRAFT" } = queryStringParameters ?? {};
  const { productId } = pathParameters ?? {};
  let accountId = requestAccountId;

  if (!vendorId || !accountId)
    throw new Error("AccountId or VendorId is required");

  const mapAccount = await fetchMapAccount(accountId);
  if (mapAccount) accountId = mapAccount;

  const products = await fetchProductsByVendorRepository(
    accountId,
    vendorId,
    +skip,
    +limit,
    status,
    productId,
    channelId,
    storeId
  );

  const { data } = products;
  const productResponse = data?.[0] ?? {};
  const productsResponse = products ?? [];

  return {
    statusCode: 200,
    body: JSON.stringify(productId ? productResponse : productsResponse)
  };
};
