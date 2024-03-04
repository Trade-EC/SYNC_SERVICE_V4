import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";
import { DbProduct } from "/opt/nodejs/sync-service-layer/types/products.types";
import { SyncProductRecord } from "/opt/nodejs/sync-service-layer/types/common.types";
import { saveErrorSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";

import { CreateProductProps } from "./createProduct.types";

/**
 *
 * @param product
 * @param storesId
 * @param vendorId
 * @param channelId
 * @param listName
 * @description Create or update product
 * @returns @link SendMessageBatchRequestEntry[]
 */
export const createOrUpdateProduct = async (product: DbProduct) => {
  const dbClient = await connectToDatabase();
  const { productId } = product;

  const createdProduct = dbClient.collection("products").updateOne(
    { productId, $or: [{ status: "DRAFT" }, { status: "PUBLISHED" }] },
    {
      $set: { ...product }
    },
    { upsert: true }
  );

  return createdProduct;
};

/**
 *
 * @param SyncProductRecord register
 * @param source
 * @param string listHash
 * @description Verify if sync list is success
 * @returns {Promise<void>}
 */
export const verifyCompletedList = async (
  register: SyncProductRecord,
  source: "LISTS" | "PRODUCTS",
  listHash: string
) => {
  const { status, productId, ...registerFilter } = register;
  const { accountId, channelId, storeId, vendorId, listId } = registerFilter;
  const commonFilters = {
    vendorId,
    channelId,
    accountId,
    storeId,
    listId,
    source,
    hash: listHash
  };
  const dbClient = await connectToDatabase();
  await dbClient
    .collection("syncLists")
    .updateOne(
      { productId, ...commonFilters },
      { $set: { status: "SUCCESS" } },
      { upsert: false }
    );
  const allRecords = await dbClient
    .collection("syncLists")
    .find({ ...registerFilter })
    .toArray();

  const pendingExists = allRecords.some(record => record.status === "PENDING");
  const allSuccess = allRecords.every(record => record.status === "SUCCESS");
  const errorExists = allRecords.some(record => record.status === "ERROR");

  const syncRequest: SyncRequest = {
    accountId,
    status: "SUCCESS",
    type: source,
    vendorId,
    hash: listHash,
    metadata: {
      channelId,
      storesId: storeId,
      listId
    }
  };
  if (allSuccess && !pendingExists) {
    await saveSyncRequest(syncRequest, false);
    await dbClient.collection("syncLists").deleteMany(commonFilters);
  }

  if (errorExists && !pendingExists) {
    await saveErrorSyncRequest(syncRequest);
  }
};

export const updateErrorProductSyncRecord = async (
  register: SyncProductRecord,
  errorMessage: string
) => {
  const dbClient = await connectToDatabase();
  const { status, ...registerFilter } = register;
  await dbClient
    .collection("syncLists")
    .updateOne(
      { ...registerFilter },
      { $set: { status: "ERROR", errorMessage } }
    );
};

export const errorCreateProduct = async (
  props: CreateProductProps,
  errorMessage: string
) => {
  const { listHash, body } = props;
  const { accountId, source, vendorId, listId, channelId, storeId } = body;
  const { product } = body;
  const { productId } = product;
  const dbProductId = `${accountId}.${vendorId}.${productId}`;
  const commonFilters = {
    vendorId,
    channelId,
    accountId,
    storeId,
    listId,
    source,
    hash: listHash,
    status: "PENDING" as const,
    productId: dbProductId
  };

  await updateErrorProductSyncRecord(commonFilters, errorMessage);

  const dbClient = await connectToDatabase();
  const allRecords = await dbClient
    .collection("syncLists")
    .find(
      { ...commonFilters, status: undefined, productId: undefined },
      { ignoreUndefined: true }
    )
    .toArray();

  const pendingExists = allRecords.some(record => record.status === "PENDING");
  const errorExists = allRecords.some(record => record.status === "ERROR");

  if (!pendingExists && errorExists) {
    await saveErrorSyncRequest({
      accountId,
      type: source,
      vendorId,
      hash: listHash,
      metadata: {
        channelId,
        storesId: storeId,
        listId
      }
    });
  }
};
