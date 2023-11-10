import { APIGatewayProxyEvent } from "aws-lambda";

import { fetchSyncLists } from "./syncSummary.repository";
import { syncSummaryValidator } from "./syncSummary.validator";

/**
 *
 * @param event
 * @description Publish sync, save in S3 and in history collection
 * @returns void
 */
export const syncSummaryService = async (event: APIGatewayProxyEvent) => {
  const { queryStringParameters } = event;
  const params = syncSummaryValidator.parse(queryStringParameters);
  const { vendorId, accountId, channelId } = params;
  const response = await fetchSyncLists(vendorId, accountId, channelId);

  return { statusCode: 200, body: JSON.stringify(response) };
};
