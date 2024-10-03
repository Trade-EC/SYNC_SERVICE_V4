import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { fetchVersionsByVendorRepository } from "./fetchVersionsByVendor.repository";
import { fetchVersionsByVendorValidator } from "./fetchVersionsByVendor.validator";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { fetchMapAccount } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";

/**
 *
 * @param event
 * @description Fetch queue events
 * @returns {Promise<APIGatewayProxyResult>}
 */
export const fetchVersionsByVendorServices = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { queryStringParameters, headers } = event;
  const { account: requestAccountId } = headersValidator.parse(headers);
  const queryParams = fetchVersionsByVendorValidator.parse(
    queryStringParameters ?? {}
  );
  const { vendorId, type } = queryParams ?? {};
  const { skip = 0, limit = 10 } = queryParams ?? {};
  let accountId = requestAccountId;

  const mapAccount = await fetchMapAccount(accountId);
  if (mapAccount) accountId = mapAccount;

  const data = await fetchVersionsByVendorRepository(
    accountId,
    vendorId,
    type,
    skip,
    limit
  );

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
