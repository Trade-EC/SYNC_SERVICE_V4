import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";
import { DbProduct } from "/opt/nodejs/types/products.types";
import { SyncProductRecord } from "/opt/nodejs/types/common.types";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { logger } from "/opt/nodejs/configs/observability.config";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";

export const createOrUpdateProduct = async (
  product: DbProduct,
  storesId: string[],
  vendorId: string,
  channelId: string,
  listName: string
) => {
  const dbClient = await connectToDatabase();
  const { productId } = product;

  const createdProduct = dbClient.collection("products").updateOne(
    { productId, status: "DRAFT" },
    {
      $set: { ...product }
    },
    { upsert: true }
  );

  const storesPromises = storesId.map(storeId => {
    return dbClient.collection("stores").updateOne(
      { storeId, status: "DRAFT" },
      {
        $addToSet: {
          catalogues: {
            catalogueId: `${vendorId}#${storeId}#${channelId}`,
            name: listName,
            active: true
          }
        }
      }
    );
  });

  await Promise.all(storesPromises);
  return createdProduct;
};

export const verifyCompletedList = async (
  register: SyncProductRecord,
  source: "LIST" | "PRODUCTS"
) => {
  const { status, ...registerFilter } = register;
  const { accountId, channelId, storeId, vendorId } = registerFilter;
  const dbClient = await connectToDatabase();
  await dbClient.collection("syncLists").updateOne(
    { ...register },
    {
      $set: { status: "SUCCESS" }
    }
  );
  const allRecords = await dbClient
    .collection("syncLists")
    .find({ ...registerFilter })
    .toArray();

  const allSuccess = allRecords.some(record => record.status !== "SUCCESS");

  if (allSuccess) {
    const syncRequest: SyncRequest = {
      accountId,
      channelId,
      status: "SUCCESS",
      storesId: storeId,
      type: source,
      vendorId
    };

    logger.info("syncRequest", { syncRequest });
    await saveSyncRequest(syncRequest);
  }
};
