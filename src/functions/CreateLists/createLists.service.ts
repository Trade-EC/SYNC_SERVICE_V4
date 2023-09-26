import { APIGatewayProxyEvent } from "aws-lambda";

import { createOrUpdateProducts } from "./createLists.repository";
import { listsValidator } from "./createLists.validator";
import { transformKFCList } from "./createLists.transform";
import { Lists } from "./createLists.types";

import { transformProduct } from "/opt/nodejs/transforms/product.transform";
import { headersValidator } from "/opt/nodejs/validators/common.validator";
import { fetchDraftStores } from "/opt/nodejs/repositories/common.repository";

export const syncListsService = async (event: APIGatewayProxyEvent) => {
  const { body, headers } = event;
  const parsedBody = JSON.parse(body ?? "");
  const { Account: accountId } = headersValidator.parse(headers);
  let listInfo;
  if (accountId === "1") {
    listInfo = transformKFCList(parsedBody, listsValidator) as Lists;
  } else {
    listInfo = listsValidator.parse(parsedBody);
  }
  const { categories, list, modifierGroups, products } = listInfo;
  const { channelId, storeId, vendorId, listName } = list;
  let storesId: string[];
  if (storeId === "replicate_in_all") {
    const dbStores = await fetchDraftStores(accountId, vendorId);
    storesId = dbStores.map(dbStore => dbStore.storeId);
  } else {
    storesId = storeId.split(",");
  }

  const syncProductsPromises = products.map(product =>
    transformProduct({
      product,
      storesId,
      channelId,
      accountId,
      vendorId,
      products,
      modifierGroups,
      categories
    })
  );

  const syncProducts = await Promise.all(syncProductsPromises);

  const newProducts = await createOrUpdateProducts(
    syncProducts,
    storesId,
    vendorId,
    channelId,
    listName
  );

  return newProducts;
};
