import { APIGatewayProxyEvent } from "aws-lambda";

import { PrepareProductsPayload } from "../PrepareProducts/prepareProducts.types";

import { headersValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { productsQueryParamsValidator } from "/opt/nodejs/sync-service-layer/validators/common.validator";
import { fetchSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
//@ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";
// @ts-ignore
import { v4 as uuid } from "/opt/nodejs/sync-service-layer/node_modules/uuid";
import { validateProducts } from "/opt/nodejs/transforms-layer/validators/products.validator";
import { generateSyncS3Path } from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { createFileS3 } from "/opt/nodejs/sync-service-layer/utils/s3.utils";
import { fetchMapAccount } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { fetchVendor } from "/opt/nodejs/sync-service-layer/repositories/vendors.repository";
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

/**
 *
 * @param event {@link APIGatewayProxyEvent}
 * @description Validate products
 * @returns void
 */
export const validateProductsService = async (event: APIGatewayProxyEvent) => {
  logger.info("PRODUCTS VALIDATE: INIT");
  const requestUid = uuid();
  const { body, headers, queryStringParameters } = event;
  const { type } = productsQueryParamsValidator.parse(
    queryStringParameters ?? {}
  );
  const syncAll = type === "ALL";
  const parsedBody = JSON.parse(body ?? "");
  const { account: requestAccountId, country: countryId } =
    headersValidator.parse(headers);
  let accountId = requestAccountId;
  const listInfo = validateProducts(parsedBody, accountId);
  const { list } = listInfo;
  const { storeId, vendorId, listId } = list;
  logger.appendKeys({
    vendorId,
    accountId,
    listId,
    storeId,
    requestId: requestUid
  });
  logger.info("PRODUCTS VALIDATE: VALIDATING");
  const mapAccount = await fetchMapAccount(accountId);
  if (mapAccount) accountId = mapAccount;
  const vendor = await fetchVendor(vendorId, accountId, countryId);
  if (!vendor) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Vendor not found"
      })
    };
  }
  const { active } = vendor;
  if (!active) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: "Vendor is not active"
      })
    };
  }
  const { channels: vendorChannels } = vendor;
  const { channelReferenceName, channelId: listChannelId } = list;
  const { ecommerceChannelId } = list;
  const channel = vendorChannels.find(vendorChannel => {
    return (
      (vendorChannel.channelReferenceName === (channelReferenceName ?? null) ||
        vendorChannel.ecommerceChannelId ==
          (ecommerceChannelId?.toString() ?? null)) &&
      vendorChannel.channelId === listChannelId
    );
  });
  if (!channel) {
    throw new Error("Channel not found");
  }
  const channelId = channel.ecommerceChannelId ?? channel.channelId;
  const hash = sha1(JSON.stringify(parsedBody));
  const s3Path = generateSyncS3Path(accountId, vendorId, "PRODUCTS");
  const { Location } = await createFileS3(s3Path, listInfo);
  const syncRequest: SyncRequest = {
    accountId,
    status: "PENDING",
    type: "PRODUCTS",
    vendorId,
    hash,
    createdAt: new Date(),
    metadata: { channelId, storesId: storeId, listId },
    s3Path: Location
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
  syncRequest.requestId = requestUid;
  await saveSyncRequest(syncRequest);

  logger.info("PRODUCTS VALIDATE: SEND TO SQS");
  // await syncProducts(listInfo, accountId, hash, channelId, syncAll);
  const payload: PrepareProductsPayload = {
    listInfo,
    accountId,
    listHash: hash,
    channelId,
    syncAll,
    source: "PRODUCTS",
    requestId: requestUid,
    countryId
  };

  await sqsExtendedClient.sendMessage({
    QueueUrl: process.env.PREPARE_PRODUCTS_SQS_URL ?? "",
    MessageBody: JSON.stringify(payload),
    MessageGroupId: `${accountId}-${countryId}-${vendorId}`
  });

  logger.info("PRODUCTS VALIDATE: FINISHED");
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "We've received your request. We'll notify you when it's done."
    })
  };
};
