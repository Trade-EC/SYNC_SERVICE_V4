import { APIGatewayProxyEvent } from "aws-lambda";

import { transformProduct } from "./createLists.transform";
import { listsValidator } from "./createLists.validator";

import { connectToDatabase } from "/opt/nodejs/utils/mongo.utils";

export const syncListsService = async (event: APIGatewayProxyEvent) => {
  const { body } = event;
  const dbClient = await connectToDatabase();
  const parsedBody = JSON.parse(body ?? "");
  const validatedInfo = listsValidator.parse(parsedBody);
  const { categories, list, modifierGroups, products } = validatedInfo;
  const { channelId, storeId, vendorId, listName } = list;
  let storesId: string[];
  if (storeId === "replicate_in_all") {
    // TODO: get all storesId from mongo
    storesId = storeId.split(",");
  } else {
    storesId = storeId.split(",");
  }

  const syncProducts = products.map(product =>
    transformProduct({
      product,
      storesId,
      channelId,
      vendorId,
      products,
      modifierGroups,
      categories
    })
  );

  const productPromises = syncProducts.map(product => {
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
  // TODO: Update catalogue in stores
  const newProducts = await Promise.all(productPromises);
  return newProducts;
};
