import { connectToDatabase } from "/opt/nodejs/sync-service-layer/utils/mongo.utils";
import { DbProduct } from "/opt/nodejs/sync-service-layer/types/products.types";
import { SyncProductRecord } from "/opt/nodejs/sync-service-layer/types/common.types";
import { saveErrorSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";

import { CreateProductProps } from "./createProduct.types";
import { Vendor } from "../../layers/sync-service-layer/types/vendor.types";

import { getDateNow } from "/opt/nodejs/sync-service-layer/utils/common.utils";

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
      $set: { ...product, createdAt: getDateNow() }
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
  const { requestId, countryId } = registerFilter;
  const commonFilters = {
    vendorId,
    channelId,
    accountId,
    storeId,
    listId,
    source,
    hash: listHash,
    requestId
  };
  const dbClient = await connectToDatabase();
  await dbClient
    .collection("syncLists")
    .updateOne(
      { productId, status: "PENDING", ...commonFilters },
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
    countryId,
    status: "SUCCESS",
    type: source,
    vendorId,
    hash: listHash,
    requestId,
    metadata: {
      channelId,
      storesId: storeId,
      listId
    }
  };
  if (allSuccess && !pendingExists) {
    await saveSyncRequest(syncRequest, false);
    await dbClient.collection("syncLists").deleteMany(commonFilters);
    await automaticallyPublishSync(vendorId, accountId, countryId);
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
  const { listHash, body, requestId } = props;
  const { accountId, source, vendorId, listId, channelId, storeId } = body;
  const { countryId, productId } = body;
  const dbProductId = `${accountId}.${countryId}.${vendorId}.${productId}`;
  const commonFilters = {
    vendorId,
    channelId,
    accountId,
    countryId,
    storeId,
    listId,
    source,
    hash: listHash,
    status: "PENDING" as const,
    productId: dbProductId,
    requestId
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

export const deactivateStoreInProduct = async (
  productId: string,
  vendorIdStoreIdChannelId: string[],
  accountId: string,
  vendorId: string,
  countryId: string
) => {
  const dbClient = await connectToDatabase();
  return dbClient.collection<DbProduct>("products").updateMany(
    {
      "account.accountId": accountId,
      "vendor.id": `${accountId}.${countryId}.${vendorId}`,
      productId,
      "statuses.vendorIdStoreIdChannelId": {
        $in: vendorIdStoreIdChannelId
      }
    },
    {
      $set: { status: "DRAFT" },
      $pullAll: {
        "statuses.$[].vendorIdStoreIdChannelId": vendorIdStoreIdChannelId, // Usamos $[] para indicar que se aplique a cada elemento del array statuses
        "images.$[].vendorIdStoreIdChannelId": vendorIdStoreIdChannelId,
        "prices.$[].vendorIdStoreIdChannelId": vendorIdStoreIdChannelId,
        "categories.$[].vendorIdStoreIdChannelId": vendorIdStoreIdChannelId
      }
    }
  );
};

const fetchVendor = async (
  vendorId: string,
  accountId: string,
  countryId: string
) => {
  const dbClient = await connectToDatabase();
  const vendor = await dbClient.collection("vendors").findOne({
    externalId: vendorId,
    "account.accountId": accountId,
    countryId
  });
  return vendor as unknown as Vendor;
};

export const automaticallyPublishSync = async (
  vendorId: string,
  accountId: string,
  countryId: string
) => {
  try {
    const vendor = await fetchVendor(vendorId, accountId, countryId);
    if (!vendor) return;
    const { automaticallyPublishSync } = vendor;
    if (automaticallyPublishSync) {
      const host = process.env.API_ENDPOINT;
      const url = `${host}/api/v4/publish-sync`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          account: accountId,
          country: countryId
        },
        body: JSON.stringify({ vendorId: vendor.vendorId })
      });
      console.log(
        JSON.stringify({
          message: "Automatic publishing sync",
          status: response.status,
          body: await response.text()
        })
      );
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Error in automatic publishing sync",
        error
      })
    );
  }
};
