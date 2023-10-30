import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";
import { DbProduct } from "/opt/nodejs/types/products.types";
import { SyncProductRecord } from "/opt/nodejs/types/common.types";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
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
  const { accountId, channelId, storeId, vendorId, listId } = registerFilter;
  const { productId } = registerFilter;
  const dbClient = await connectToDatabase();
  await dbClient
    .collection("syncLists")
    .updateOne(
      { productId, vendorId, channelId, accountId, storeId, listId },
      { $set: { status: "SUCCESS" } },
      { upsert: false }
    );
  const allRecords = await dbClient
    .collection("syncLists")
    .find({ ...registerFilter })
    .toArray();

  const somePending = allRecords.some(record => record.status === "PENDING");

  if (!somePending) {
    const syncRequest: SyncRequest = {
      accountId,
      channelId,
      status: "SUCCESS",
      storesId: storeId,
      type: source,
      vendorId
    };

    await saveSyncRequest(syncRequest, false);
    await dbClient
      .collection("syncLists")
      .deleteMany({ accountId, channelId, storeId, vendorId, listId });
  }
};
