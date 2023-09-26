import { APIGatewayProxyEvent } from "aws-lambda";

import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { lambdaClient } from "/opt/nodejs/configs/config";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { fetchSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";

import { transformKFCList } from "./validateLists.transform";
import { listsValidator } from "./validateLists.validator";
import { Lists } from "../CreateLists/createLists.types";

export const validateListsService = async (event: APIGatewayProxyEvent) => {
  const { body, headers, requestContext } = event;
  const { requestId: xArtisnTraceId } = requestContext;
  const parsedBody = JSON.parse(body ?? "");
  const { Account: accountId } = headersValidator.parse(headers);
  let listInfo;
  if (accountId === "1") {
    listInfo = transformKFCList(parsedBody, listsValidator) as Lists;
  } else {
    listInfo = listsValidator.parse(parsedBody);
  }
  const { list } = listInfo;
  const { storeId, vendorId, channelId } = list;
  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "PENDING",
    storesId: storeId,
    type: "LISTS",
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
    FunctionName: "sync-service-v4-CreateLists-SusPD2IRkLu4",
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
