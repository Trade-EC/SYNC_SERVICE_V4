import { connectToDatabase } from "../utils/mongo.utils";

export const fetchDraftStores = async (accountId: string, vendorId: string) => {
  const dbClient = await connectToDatabase();
  const stores = await dbClient
    .collection("stores")
    .find(
      {
        status: "DRAFT",
        "vendor.id": vendorId,
        accounts: { $elemMatch: { id: accountId } }
      },
      { projection: { storeId: 1, _id: 0 } }
    )
    .toArray();
  return stores;
};

export const findProduct = async (productId: string) => {
  const dbClient = await connectToDatabase();
  const product = await dbClient
    .collection("products")
    .findOne({ productId, status: "DRAFT" });
  return product;
};
