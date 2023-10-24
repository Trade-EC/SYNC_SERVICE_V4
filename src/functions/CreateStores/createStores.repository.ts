import { DBStore } from "./createStores.types";

import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

export const createOrUpdateStores = async (stores: DBStore[]) => {
  const dbClient = await connectToDatabase();
  const storePromises = stores.map(store => {
    const { storeId } = store;
    return dbClient
      .collection("stores")
      .updateOne(
        { storeId, status: "DRAFT" },
        { $set: { ...store } },
        { upsert: true }
      );
  });
  const newStores = await Promise.all(storePromises);
  return newStores;
};
