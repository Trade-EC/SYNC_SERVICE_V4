import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { sqsClient } from "/opt/nodejs/configs/config";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { productsValidator } from "/opt/nodejs/validators/lists.validator";

import { transformKFCProducts } from "./validateProducts.transform";
import { Lists } from "./validateProducts.types";

export const validateProductsService = async (event: APIGatewayProxyEvent) => {
  const { body, headers, requestContext } = event;
  const { requestId: xArtisnTraceId } = requestContext;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
  let listInfo;
  if (accountId === "1") {
    listInfo = transformKFCProducts(parsedBody, productsValidator) as Lists;
  } else {
    listInfo = productsValidator.parse(parsedBody);
  }
  const { list } = listInfo;
  const { storeId, vendorId, channelId } = list;
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

  await sqsClient.sendMessage({
    QueueUrl: process.env.SYNC_PRODUCTS_SQS_URL!,
    MessageBody: JSON.stringify({
      body: listInfo,
      headers: { ...newHeaders, xArtisnTraceId }
    }),
    MessageGroupId: `${vendorId}-${accountId}`
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
