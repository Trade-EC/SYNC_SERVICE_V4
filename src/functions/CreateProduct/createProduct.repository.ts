import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

export const createOrUpdateProduct = async (
  product: any,
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
