import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

// TODO: fix types
export const createOrUpdateStores = async (stores: any) => {
  const dbClient = await connectToDatabase();
  const storePromises = stores.map((store: any) => {
    const { storeId } = store;
    return dbClient.collection("stores").updateOne(
      { storeId, status: "DRAFT" },
      {
        $set: { ...store }
      },
      { upsert: true }
    );
  });
  const newStores = await Promise.all(storePromises);
  return newStores;
};
