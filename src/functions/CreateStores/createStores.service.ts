import { saveSyncRequest } from "/opt/nodejs/sync-service-layer/repositories/syncRequest.repository";
import { SyncRequest } from "/opt/nodejs/sync-service-layer/types/syncRequest.types";
import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
// @ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";

import { createOrUpdateStores, findStore } from "./createStores.repository";
import { verifyCompletedStore } from "./createStores.repository";
import { storeTransformer } from "./createStores.transform";
import { CreateStoreProps } from "./createStores.types";

import { sortObjectByKeys } from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { SyncStoreRecord } from "/opt/nodejs/sync-service-layer/types/common.types";

/**
 *
 * @param props {@link CreateProductProps}
 * @description Create or update stores in database
 * @returns void
 */
export const syncStoresService = async (props: CreateStoreProps) => {
  const { body, storeHash, syncAll } = props;
  const { accountId, isLast, store, vendorId } = body;
  const { storeId } = store;
  logger.appendKeys({ vendorId, accountId });
  logger.info("STORE: INIT");
  const storeDB = await findStore(storeId);
  const transformedStore = storeTransformer(store, accountId, vendorId);
  const orderedTransformStore = sortObjectByKeys(transformedStore);
  const syncStoreRequest: SyncStoreRecord = {
    accountId,
    status: "SUCCESS",
    vendorId,
    storeId
  };

  if (!storeDB) {
    const hash = sha1(JSON.stringify(orderedTransformStore));
    const version = new Date().getTime();
    orderedTransformStore.hash = hash;
    orderedTransformStore.version = version;
    logger.info("STORE: CREATE", { store: orderedTransformStore });
    await createOrUpdateStores(orderedTransformStore);
    logger.info("STORE: VERIFY COMPLETED STORE");
    await verifyCompletedStore(syncStoreRequest, storeHash);
    logger.info("STORE: FINISHED");
    return;
  }

  const newHash = sha1(JSON.stringify(orderedTransformStore));
  const version = new Date().getTime();
  orderedTransformStore.hash = newHash;
  orderedTransformStore.version = version;
  const { hash } = storeDB;
  if (hash === newHash && !syncAll) {
    logger.info("STORE: NO CHANGES");
    logger.info("STORE: VERIFY COMPLETED STORE");
    await verifyCompletedStore(syncStoreRequest, storeHash);
    logger.info("STORE: FINISHED");
    return;
  }

  logger.info("STORE: UPDATE", { store: orderedTransformStore });
  await createOrUpdateStores(orderedTransformStore);
  logger.info("STORE: VERIFY COMPLETED STORE");
  await verifyCompletedStore(syncStoreRequest, storeHash);
  logger.info("STORE: FINISHED");
  return;
};
