import { createOrUpdateProducts } from "./createLists.repository";
import { Lists } from "./createLists.types";

import { transformProduct } from "/opt/nodejs/transforms/product.transform";
import { fetchDraftStores } from "/opt/nodejs/repositories/common.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";

export const syncListsService = async (listInfo: Lists, accountId: string) => {
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

  const syncRequest: SyncRequest = {
    accountId,
    channelId,
    status: "SUCCESS",
    storesId: storeId,
    type: "LISTS",
    vendorId
  };

  await saveSyncRequest(syncRequest);

  return newProducts;
};
