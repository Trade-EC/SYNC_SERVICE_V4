import { logger } from "/opt/nodejs/sync-service-layer/configs/observability.config";
// @ts-ignore
import sha1 from "/opt/nodejs/sync-service-layer/node_modules/sha1";

import { findStore } from "./createStores.repository";
import { createOrUpdateStores } from "./createStores.repository";
import { verifyCompletedStore } from "./createStores.repository";
import { storeTransformer } from "./createStores.transform";
import { CreateStoreProps } from "./createStores.types";
import { CreateShippingCostProps } from "../CreateShippingCost/createShippingCost.types";

import { sortObjectByKeys } from "/opt/nodejs/sync-service-layer/utils/common.utils";
import { SyncStoreRecord } from "/opt/nodejs/sync-service-layer/types/common.types";
import { sqsClient } from "/opt/nodejs/sync-service-layer/configs/config";

/**
 *
 * @param props {@link CreateProductProps}
 * @description Create or update stores in database
 * @returns void
 */
export const syncStoresService = async (props: CreateStoreProps) => {
  const { body, storeHash, syncAll } = props;
  const { accountId, store, vendorId } = body;
  const { storeId, deliveryInfo, storeChannels } = store;
  const { deliveryId, shippingCost } = deliveryInfo ?? {};
  const dbStoreId = `${accountId}#${vendorId}#${storeId}`;
  logger.appendKeys({ vendorId, accountId });
  logger.info("STORE: INIT");
  const storeDB = await findStore(dbStoreId);
  const { shippingCostId } = storeDB ?? {};
  const transformedStore = storeTransformer(store, accountId, vendorId);
  const orderedTransformStore = sortObjectByKeys(transformedStore);
  const syncStoreRequest: SyncStoreRecord = {
    accountId,
    status: "SUCCESS",
    vendorId,
    storeId: dbStoreId
  };
  if (deliveryId && typeof shippingCost !== "undefined") {
    const shippingPayload: CreateShippingCostProps = {
      accountId,
      deliveryId,
      shippingCost,
      storeChannels,
      storeId,
      vendorId,
      oldShippingCostId: shippingCostId
    };
    logger.info("STORE: SEND SHIPPING COST", { shippingPayload });
    await sqsClient.sendMessage({
      QueueUrl: process.env.SYNC_SHIPPING_COST_SQS_URL ?? "",
      MessageBody: JSON.stringify(shippingPayload),
      MessageGroupId: `${accountId}-${vendorId}-${deliveryId}`
    });
  }
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
  orderedTransformStore.catalogues = syncAll ? [] : storeDB.catalogues;
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
