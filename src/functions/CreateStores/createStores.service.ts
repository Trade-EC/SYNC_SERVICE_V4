import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";

import { createOrUpdateStores } from "./createStores.repository";
import { storeTransformer } from "./createStores.transform";
import { ChannelsAndStores } from "./createStores.types";

export const syncStoresService = async (
  channelsAndStores: ChannelsAndStores,
  accountId: string
) => {
  const { stores, vendorId } = channelsAndStores;
  const syncStores = stores.map(store =>
    storeTransformer(store, accountId, vendorId)
  );
  const newStores = await createOrUpdateStores(syncStores);
  const syncRequest: SyncRequest = {
    accountId,
    status: "SUCCESS",
    type: "CHANNELS_STORES",
    vendorId
  };
  await saveSyncRequest(syncRequest);
  return newStores;
};

// TODO: Hacer sincro de imagenes y verificar porque se crean dos categorías. Eliminar las entities que no tienen VendorIdStoreIdChannelId
