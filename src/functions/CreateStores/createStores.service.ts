import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
// @ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";

import { createOrUpdateStores } from "./createStores.repository";
import { storeTransformer } from "./createStores.transform";
import { ChannelsAndStores } from "./createStores.types";

/**
 *
 * @param channelsAndStores
 * @param accountId
 * @description Create or update stores in database
 * @returns void
 */
export const syncStoresService = async (
  channelsAndStores: ChannelsAndStores,
  accountId: string
) => {
  const { stores, vendorId } = channelsAndStores;
  logger.appendKeys({ vendorId, accountId });
  logger.info("STORE: INIT");
  const syncStores = stores.map(store =>
    storeTransformer(store, accountId, vendorId)
  );
  logger.info("STORE: CREATE", { syncStores });
  const hash = sha1(JSON.stringify(channelsAndStores));
  const newStores = await createOrUpdateStores(syncStores);
  const syncRequest: SyncRequest = {
    accountId,
    status: "SUCCESS",
    type: "CHANNELS_STORES",
    vendorId,
    hash
  };
  await saveSyncRequest(syncRequest);
  logger.info("STORE: FINISHED");
  return newStores;
};
