import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { transformKFCStores } from "/opt/nodejs/transforms/kfcStore.transform";
import { sqsClient } from "/opt/nodejs/configs/config";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { channelsAndStoresValidator } from "/opt/nodejs/validators/requestStore.validator";

import { ChannelsAndStores } from "./validateStores.types";

export const validateStoresService = async (event: APIGatewayProxyEvent) => {
  const { body, headers, requestContext } = event;
  const { requestId: xArtisnTraceId } = requestContext;
  const parsedBody = JSON.parse(body ?? "");
  const { account: accountId } = headersValidator.parse(headers);
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

  await sqsClient.sendMessage({
    QueueUrl: process.env.SYNC_STORES_SQS_URL!,
    MessageBody: JSON.stringify({
      body: channelsAndStores,
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
