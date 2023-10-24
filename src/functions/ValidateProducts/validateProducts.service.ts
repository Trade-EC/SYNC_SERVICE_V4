import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { sqsClient } from "/opt/nodejs/configs/config";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { productsValidator } from "/opt/nodejs/validators/lists.validator";
import { logger } from "/opt/nodejs/configs/observability.config";

import { transformKFCProducts } from "./validateProducts.transform";
import { Lists } from "./validateProducts.types";

const kfcAccounts = ["1", "9"];

export const validateProductsService = async (event: APIGatewayProxyEvent) => {
  const { body, headers, requestContext } = event;
  const { requestId: xArtisnTraceId } = requestContext;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  let listInfo;
  // TODO: Reemplazar por validadores custom
  if (kfcAccounts.includes(accountId)) {
    listInfo = transformKFCProducts(parsedBody, productsValidator) as Lists;
  } else {
    listInfo = productsValidator.parse(parsedBody);
  }
  const { list } = listInfo;
  const { storeId, vendorId, channelId } = list;
  logger.appendKeys({ vendorId, accountId });
  logger.info("Validating Products");
  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "PENDING",
    storesId: storeId,
    type: "PRODUCTS",
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

  logger.info("Sending creation products requests to SQS");
  await sqsClient.sendMessage({
    QueueUrl: process.env.SYNC_PRODUCTS_SQS_URL!,
    MessageBody: JSON.stringify({
      body: listInfo,
      headers: { ...newHeaders, xArtisnTraceId }
    }),
    MessageGroupId: `${vendorId}-${accountId}`
  });

  logger.info("Validation products finished");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
