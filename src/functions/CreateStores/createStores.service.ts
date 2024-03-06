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
import { sqsExtendedClient } from "/opt/nodejs/sync-service-layer/configs/config";

/**
 *
 * @param props {@link CreateProductProps}
 * @description Create or update stores in database
 * @returns void
 */
export const syncStoresService = async (props: CreateStoreProps) => {
  const { body, storeHash, syncAll, requestId } = props;
  const { accountId, store, vendorId, vendorChannels } = body;
  const { storeId, deliveryInfo, storeChannels } = store;
  const { deliveryId, shippingCost } = deliveryInfo ?? {};
  const dbStoreId = `${accountId}.${vendorId}.${storeId}`;
  const logKeys = { vendorId, accountId, storeId, requestId };
  logger.info("STORE: INIT", logKeys);
  const vendorStoreChannels = storeChannels
    .map(storeChannel => {
      const filterVendorChannels = vendorChannels.filter(
        vendorChannel => vendorChannel.channelId === storeChannel
      );
      const channels = filterVendorChannels.map(vendorChannel => {
        const { ecommerceChannelId, channelId } = vendorChannel;
        return ecommerceChannelId ?? channelId;
      });
      return channels;
    })
    .flat();
  const uniqueVendorStoreChannels = [...new Set(vendorStoreChannels)];
  const storeDB = await findStore(dbStoreId);
  const { shippingCostId } = storeDB ?? {};
  const transformedStore = storeTransformer(
    store,
    accountId,
    vendorId,
    uniqueVendorStoreChannels,
    vendorChannels
  );
  const orderedTransformStore = sortObjectByKeys(transformedStore);
  const syncStoreRequest: SyncStoreRecord = {
    accountId,
    status: "SUCCESS",
    vendorId,
    storeId: dbStoreId,
    requestId
  };
  if (deliveryId && typeof shippingCost !== "undefined") {
    const shippingPayload: CreateShippingCostProps = {
      accountId,
      deliveryId,
      shippingCost,
      storeChannels: uniqueVendorStoreChannels,
      storeId,
      vendorId,
      oldShippingCostId: shippingCostId
    };
    logger.info("STORE: SEND SHIPPING COST", { shippingPayload, ...logKeys });
    await sqsExtendedClient.sendMessage({
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
    logger.info("STORE: CREATE", { store: orderedTransformStore, ...logKeys });
    await createOrUpdateStores(orderedTransformStore);
    logger.info("STORE: VERIFY COMPLETED STORE", logKeys);
    await verifyCompletedStore(syncStoreRequest, storeHash);
    logger.info("STORE: FINISHED", logKeys);
    return;
  }

  const newHash = sha1(JSON.stringify(orderedTransformStore));
  const version = new Date().getTime();
  orderedTransformStore.hash = newHash;
  orderedTransformStore.version = version;
  const { hash } = storeDB;
  if (hash === newHash && !syncAll) {
    logger.info("STORE: NO CHANGES", logKeys);
    logger.info("STORE: VERIFY COMPLETED STORE", logKeys);
    await verifyCompletedStore(syncStoreRequest, storeHash);
    logger.info("STORE: FINISHED", logKeys);
    return;
  }

  logger.info("STORE: UPDATE", { store: orderedTransformStore, ...logKeys });
  await createOrUpdateStores(orderedTransformStore);
  logger.info("STORE: VERIFY COMPLETED STORE", logKeys);
  await verifyCompletedStore(syncStoreRequest, storeHash);
  logger.info("STORE: FINISHED", logKeys);
  return;
};
