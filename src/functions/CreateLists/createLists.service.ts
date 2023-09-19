import { APIGatewayProxyEvent } from "aws-lambda";

import { createOrUpdateProducts } from "./createLists.repository";
import { listsValidator } from "./createLists.validator";

import { transformProduct } from "/opt/nodejs/transforms/product.transform";

export const syncListsService = async (event: APIGatewayProxyEvent) => {
  const { body } = event;
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

  const newProducts = createOrUpdateProducts(
    syncProducts,
    storesId,
    vendorId,
    channelId,
    listName
  );

  return newProducts;
};
