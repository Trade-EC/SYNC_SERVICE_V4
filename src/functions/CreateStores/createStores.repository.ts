import { DBStore } from "./createStores.types";

import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

/**
 * @param stores DbStores to create or update
 * @returns void
 */

export const createOrUpdateStores = async (stores: DBStore[]) => {
  const dbClient = await connectToDatabase();
  const storePromises = stores.map(store => {
    const { storeId } = store;
    return dbClient
      .collection("stores")
      .updateOne(
        { storeId, $or: [{ status: "DRAFT" }, { status: "PUBLISHED" }] },
        { $set: { ...store } },
        { upsert: true }
      );
  });
  const newStores = await Promise.all(storePromises);
  return newStores;
};
