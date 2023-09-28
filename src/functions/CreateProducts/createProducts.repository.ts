import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

// TODO: fix types
export const createProducts = async (
  products: any,
  storesId: string[],
  vendorId: string,
  channelId: string,
  listName: string
) => {
  const dbClient = await connectToDatabase();
  const productPromises = products.map((product: any) => {
    const { productId } = product;
    return dbClient.collection("products").updateOne(
      { productId, status: "DRAFT" },
      {
        $set: { ...product }
      },
      { upsert: true }
    );
  });

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
  const newProducts = await Promise.all(productPromises);
  return newProducts;
};
