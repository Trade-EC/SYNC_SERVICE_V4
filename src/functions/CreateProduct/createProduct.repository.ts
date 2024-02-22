import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";
import { DbProduct } from "/opt/nodejs/sync-service-layer/types/products.types";
import { SyncProductRecord } from "/opt/nodejs/sync-service-layer/types/common.types";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";

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

  const allSuccess = allRecords.every(record => record.status === "SUCCESS");

  if (allSuccess) {
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

    await saveSyncRequest(syncRequest, false);
    await dbClient.collection("syncLists").deleteMany(commonFilters);
  }
};
