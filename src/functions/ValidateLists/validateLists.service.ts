import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { sqsClient } from "/opt/nodejs/configs/config";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { logger } from "/opt/nodejs/configs/observability.config";

import { transformKFCList } from "./validateLists.transform";
import { listsValidator } from "./validateLists.validator";
import { Lists } from "../CreateLists/createLists.types";

const kfcAccounts = ["1", "9"];

export const validateListsService = async (event: APIGatewayProxyEvent) => {
  const { body, headers, requestContext } = event;
  const { requestId: xArtisnTraceId } = requestContext;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  let listInfo;
  if (kfcAccounts.includes(accountId)) {
    listInfo = transformKFCList(parsedBody, listsValidator) as Lists;
  } else {
    listInfo = listsValidator.parse(parsedBody);
  }
  const { list } = listInfo;
  const { storeId, vendorId, channelId } = list;
  logger.appendKeys({ vendorId, accountId });
  logger.info("Validating lists");
  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "PENDING",
    storesId: storeId,
    type: "LIST",
    vendorId
  };
  const dbSyncRequest = await fetchSyncRequest(syncRequest);
  if (dbSyncRequest) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Another sync is in progress with this configuration"
      })
    };
  }
  await saveSyncRequest(syncRequest);
  const newHeaders = { accountId };
  logger.info("Sending creation lists requests to SQS");
  await sqsClient.sendMessage({
    QueueUrl: process.env.SYNC_LISTS_SQS_URL!,
    MessageBody: JSON.stringify({
      body: listInfo,
      headers: { ...newHeaders, xArtisnTraceId }
    }),
    MessageGroupId: `${vendorId}-${accountId}`
  });

  logger.info("Validation lists finished");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
