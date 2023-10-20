import { saveSyncRequest } from "/opt/nodejs/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/types/syncRequest.types";
import { logger } from "/opt/nodejs/configs/observability.config";

import { createOrUpdateStores } from "./createStores.repository";
import { storeTransformer } from "./createStores.transform";
import { ChannelsAndStores } from "./createStores.types";

export const syncStoresService = async (
  channelsAndStores: ChannelsAndStores,
  accountId: string
) => {
  const { stores, vendorId } = channelsAndStores;
  logger.appendKeys({ vendorId, accountId });
  logger.info("Creating stores initiating");
  const syncStores = stores.map(store =>
    storeTransformer(store, accountId, vendorId)
  );
  logger.info("Creating stores storing", { syncStores });
  const newStores = await createOrUpdateStores(syncStores);
  const syncRequest: SyncRequest = {
    accountId,
    status: "SUCCESS",
    type: "CHANNELS_STORES",
    vendorId
  };
  await saveSyncRequest(syncRequest);
  logger.info("Creating stores finished");
  return newStores;
};
