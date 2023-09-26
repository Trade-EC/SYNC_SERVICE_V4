import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { lambdaClient } from "/opt/nodejs/configs/config";
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
  const { Account: accountId } = headersValidator.parse(headers);
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
  // invoke lambda
  await lambdaClient.invoke({
    FunctionName: "sync-service-v4-CreateProducts-VuqMe0FMY8Ro",
    InvocationType: "Event",
    Payload: JSON.stringify({
      body: listInfo,
      headers: { ...newHeaders, xArtisnTraceId }
    })
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
