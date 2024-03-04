import { APIGatewayProxyEvent } from "aws-lambda";

import { fetchSyncLists } from "./syncSummary.repository";
import { syncSummaryValidator } from "./syncSummary.validator";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";

/**
 *
 * @param event
 * @description Publish sync, save in S3 and in history collection
 * @returns void
 */
export const syncSummaryService = async (event: APIGatewayProxyEvent) => {
  const { queryStringParameters, headers } = event;
  const { account: accountId } = headersValidator.parse(headers);
  const params = syncSummaryValidator.parse(queryStringParameters);
  const { vendorId, channelId, listId } = params;
  const response = await fetchSyncLists(vendorId, accountId, channelId, listId);

  return { statusCode: 200, body: JSON.stringify(response) };
};
