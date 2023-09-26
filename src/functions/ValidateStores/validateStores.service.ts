import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { transformKFCStores } from "/opt/nodejs/transforms/kfcStore.transform";
import { lambdaClient } from "/opt/nodejs/configs/config";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { channelsAndStoresValidator } from "/opt/nodejs/validators/store.validator";

import { ChannelsAndStores } from "./validateStores.types";
export const validateStoresService = async (event: APIGatewayProxyEvent) => {
  const { body, headers, requestContext } = event;
  const { requestId: xArtisnTraceId } = requestContext;
  const parsedBody = JSON.parse(body ?? "");
  const { Account: accountId } = headersValidator.parse(headers);
  let channelsAndStores;
  if (accountId === "1") {
    channelsAndStores = transformKFCStores(
      parsedBody,
      channelsAndStoresValidator
    ) as ChannelsAndStores;
  } else {
    channelsAndStores = channelsAndStoresValidator.parse(parsedBody);
  }
  const { vendorId } = channelsAndStores;
  const syncRequest: SyncRequest = {
    accountId,
    status: "PENDING",
    type: "CHANNELS_STORES",
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
    // TODO: Change this to ARN
    FunctionName: "sync-service-v4-CreateStores-p11G1aJpNDi5",
    InvocationType: "Event",
    Payload: JSON.stringify({
      body: channelsAndStores,
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
